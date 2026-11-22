const fs = require("node:fs/promises");
const path = require("node:path");
const { Pool } = require("pg");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

const MAX_SAMPLES = 1000;
const TELEMETRY_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const IMPORT_LOCK_ID = 718240216;

function parseTelemetryJsonl(contents, now = Date.now()) {
  const lines = contents.split(/\r?\n/);
  const samples = [];
  const seen = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    if (samples.length >= MAX_SAMPLES) {
      throw new Error(`Input exceeds the ${MAX_SAMPLES}-sample batch limit.`);
    }

    let record;
    try {
      record = JSON.parse(line);
    } catch {
      throw new Error(`Line ${index + 1} is not valid JSON.`);
    }

    if (!record || typeof record !== "object" || Array.isArray(record)) {
      throw new Error(`Line ${index + 1} must be a JSON object.`);
    }

    const unexpectedFields = Object.keys(record).filter(
      (field) => !["bus_id", "passenger_count", "recorded_at"].includes(field),
    );
    if (unexpectedFields.length) {
      throw new Error(
        `Line ${index + 1} contains unsupported fields: ${unexpectedFields.join(", ")}.`,
      );
    }

    if (typeof record.bus_id !== "string" || !record.bus_id.trim()) {
      throw new Error(`Line ${index + 1} must include a bus_id.`);
    }
    if (!Number.isSafeInteger(record.passenger_count) || record.passenger_count < 0) {
      throw new Error(`Line ${index + 1} must include a non-negative integer passenger_count.`);
    }
    if (
      typeof record.recorded_at !== "string" ||
      !TELEMETRY_TIMESTAMP.test(record.recorded_at) ||
      !Number.isFinite(Date.parse(record.recorded_at))
    ) {
      throw new Error(`Line ${index + 1} must include recorded_at as an ISO 8601 timestamp with timezone.`);
    }
    const calendarDate = record.recorded_at.slice(0, 10);
    if (new Date(`${calendarDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== calendarDate) {
      throw new Error(`Line ${index + 1} contains an invalid calendar date.`);
    }

    const recordedAt = new Date(record.recorded_at).toISOString();
    if (Date.parse(recordedAt) > now) {
      throw new Error(`Line ${index + 1} has a future recorded_at timestamp.`);
    }

    const busId = record.bus_id.trim();
    const sampleKey = `${busId}\u0000${recordedAt}`;
    if (seen.has(sampleKey)) {
      throw new Error(`Line ${index + 1} duplicates a bus and timestamp in this batch.`);
    }
    seen.add(sampleKey);
    samples.push({
      bus_id: busId,
      passenger_count: record.passenger_count,
      recorded_at: recordedAt,
    });
  }

  if (!samples.length) {
    throw new Error("The input file contains no telemetry samples.");
  }

  return samples;
}

function getCrowdLevel(occupancyPercent) {
  if (occupancyPercent <= 30) return "low";
  if (occupancyPercent <= 60) return "moderate";
  if (occupancyPercent <= 85) return "high";
  return "very high";
}

async function ingestTelemetry(samples, { pool, source, dryRun = false }) {
  if (!pool || typeof pool.connect !== "function") {
    throw new TypeError("A PostgreSQL pool is required.");
  }
  if (typeof source !== "string" || !source.trim()) {
    throw new TypeError("A named, verified measurement source is required.");
  }
  if (!Array.isArray(samples) || !samples.length || samples.length > MAX_SAMPLES) {
    throw new TypeError(`The batch must contain between 1 and ${MAX_SAMPLES} samples.`);
  }

  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query("BEGIN");
    transactionStarted = true;
    await client.query("SELECT pg_advisory_xact_lock($1)", [IMPORT_LOCK_ID]);
    await client.query("LOCK TABLE public.crowd_logs IN SHARE ROW EXCLUSIVE MODE");

    const busIds = [...new Set(samples.map((sample) => sample.bus_id))];
    const { rows: buses } = await client.query(
      "SELECT id, total_capacity FROM public.buses WHERE id = ANY($1::text[])",
      [busIds],
    );
    const capacities = new Map(
      buses.map((bus) => [bus.id, Number(bus.total_capacity)]),
    );
    const validated = samples.map((sample) => {
      const capacity = capacities.get(sample.bus_id);
      if (!Number.isSafeInteger(capacity) || capacity <= 0) {
        throw new Error(`Bus ${sample.bus_id} is missing a valid total_capacity record.`);
      }
      if (sample.passenger_count > capacity) {
        throw new Error(
          `Bus ${sample.bus_id} has ${sample.passenger_count} passengers, exceeding its capacity of ${capacity}.`,
        );
      }

      const occupancyPercent = Math.round((sample.passenger_count / capacity) * 100);
      return {
        ...sample,
        occupancy_percent: occupancyPercent,
        crowd_level: getCrowdLevel(occupancyPercent),
      };
    });

    let inserted = 0;
    let duplicates = 0;
    for (const sample of validated) {
      const { rows: existing } = await client.query(
        `SELECT id, passenger_count
         FROM public.crowd_logs
         WHERE bus_id = $1 AND recorded_at = $2`,
        [sample.bus_id, sample.recorded_at],
      );

      if (existing.length) {
        if (
          existing.some(
            (row) =>
              row.passenger_count === null ||
              row.passenger_count === undefined ||
              Number(row.passenger_count) !== sample.passenger_count,
          )
        ) {
          throw new Error(
            `Conflicting passenger_count already exists for bus ${sample.bus_id} at ${sample.recorded_at}.`,
          );
        }
        duplicates += 1;
        continue;
      }

      if (!dryRun) {
        await client.query(
          `INSERT INTO public.crowd_logs
             (bus_id, crowd_level, occupancy_percent, passenger_count, recorded_at, source)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            sample.bus_id,
            sample.crowd_level,
            sample.occupancy_percent,
            sample.passenger_count,
            sample.recorded_at,
            source.trim(),
          ],
        );
      }
      inserted += 1;
    }

    if (dryRun) {
      await client.query("ROLLBACK");
      transactionStarted = false;
    } else {
      await client.query("COMMIT");
      transactionStarted = false;
    }

    return {
      source: source.trim(),
      checked: validated.length,
      inserted: dryRun ? 0 : inserted,
      would_insert: dryRun ? inserted : undefined,
      duplicates,
      dry_run: dryRun,
    };
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function parseArguments(args) {
  const options = { input: null, source: null, dryRun: false, confirmed: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--confirm-real-measurements") {
      options.confirmed = true;
    } else if (arg === "--input" || arg === "--source") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value.`);
      }
      options[arg === "--input" ? "input" : "source"] = value;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

async function main(args = process.argv.slice(2)) {
  const options = parseArguments(args);
  if (!options.input || !options.source) {
    throw new Error("Usage: node server/scripts/ingest-crowd-logs.js --input <JSONL-file> --source <verified-source> --confirm-real-measurements [--dry-run]");
  }
  if (!options.confirmed) {
    throw new Error("Refusing to ingest unverified or simulated data; confirm the input contains real measurements.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the approved telemetry database connection.");
  }

  const contents = await fs.readFile(options.input, "utf8");
  const samples = parseTelemetryJsonl(contents);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
  try {
    const report = await ingestTelemetry(samples, {
      pool,
      source: options.source,
      dryRun: options.dryRun,
    });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Crowd telemetry ingestion failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  getCrowdLevel,
  ingestTelemetry,
  parseArguments,
  parseTelemetryJsonl,
};
