const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  getCrowdLevel,
  ingestTelemetry,
  parseArguments,
  parseTelemetryJsonl,
} = require("./scripts/ingest-crowd-logs");

const FIXED_NOW = Date.parse("2026-02-01T12:00:00.000Z");
const sample = {
  bus_id: "bus-test",
  passenger_count: 20,
  recorded_at: "2026-02-01T11:00:00.000Z",
};

function makePool({ capacities = { "bus-test": 50 }, existing = [] } = {}) {
  const queries = [];
  const inserted = [];
  const client = {
    async query(sql, values = []) {
      queries.push({ sql, values });
      if (/SELECT id, total_capacity/.test(sql)) {
        return {
          rows: values[0]
            .filter((id) => Object.hasOwn(capacities, id))
            .map((id) => ({ id, total_capacity: capacities[id] })),
        };
      }
      if (/SELECT id, passenger_count/.test(sql)) {
        return {
          rows: existing.filter(
            (row) => row.bus_id === values[0] && row.recorded_at === values[1],
          ),
        };
      }
      if (/INSERT INTO public\.crowd_logs/.test(sql)) {
        inserted.push(values);
        return { rows: [] };
      }
      return { rows: [] };
    },
    release() {
      queries.push({ sql: "RELEASE", values: [] });
    },
  };
  return {
    queries,
    inserted,
    pool: { async connect() { return client; } },
  };
}

test("parses only explicit passenger counts with zoned timestamps", () => {
  assert.deepEqual(
    parseTelemetryJsonl(JSON.stringify(sample), FIXED_NOW),
    [{ ...sample, recorded_at: "2026-02-01T11:00:00.000Z" }],
  );
  assert.throws(
    () => parseTelemetryJsonl(JSON.stringify({ ...sample, passenger_count: -1 }), FIXED_NOW),
    /non-negative integer/,
  );
  assert.throws(
    () => parseTelemetryJsonl(JSON.stringify({ ...sample, recorded_at: "2026-02-01 11:00:00" }), FIXED_NOW),
    /ISO 8601 timestamp with timezone/,
  );
  assert.throws(
    () => parseTelemetryJsonl(JSON.stringify({ ...sample, recorded_at: "2026-02-31T11:00:00Z" }), FIXED_NOW),
    /invalid calendar date/,
  );
  assert.throws(
    () => parseTelemetryJsonl(JSON.stringify({ ...sample, simulated: true }), FIXED_NOW),
    /unsupported fields/,
  );
});

test("rejects duplicated samples and future timestamps before database access", () => {
  assert.throws(
    () => parseTelemetryJsonl(`${JSON.stringify(sample)}\n${JSON.stringify(sample)}`, FIXED_NOW),
    /duplicates a bus and timestamp/,
  );
  assert.throws(
    () => parseTelemetryJsonl(
      JSON.stringify({ ...sample, recorded_at: "2026-02-01T13:00:00Z" }),
      FIXED_NOW,
    ),
    /future recorded_at/,
  );
});

test("derives crowd classification from validated occupancy", () => {
  assert.equal(getCrowdLevel(30), "low");
  assert.equal(getCrowdLevel(31), "moderate");
  assert.equal(getCrowdLevel(60), "moderate");
  assert.equal(getCrowdLevel(61), "high");
  assert.equal(getCrowdLevel(86), "very high");
});

test("inserts a capacity-bounded measurement with derived crowd fields", async () => {
  const state = makePool();
  const report = await ingestTelemetry([sample], {
    pool: state.pool,
    source: "verified test counter",
  });

  assert.equal(report.checked, 1);
  assert.equal(report.inserted, 1);
  assert.equal(report.duplicates, 0);
  assert.deepEqual(state.inserted[0], [
    "bus-test",
    "moderate",
    40,
    20,
    "2026-02-01T11:00:00.000Z",
    "verified test counter",
  ]);
  assert.ok(state.queries.some(({ sql }) => sql === "COMMIT"));
});

test("repeated identical measurements are idempotently skipped", async () => {
  const state = makePool({
    existing: [{
      id: 1,
      bus_id: "bus-test",
      passenger_count: 20,
      recorded_at: "2026-02-01T11:00:00.000Z",
    }],
  });
  const report = await ingestTelemetry([sample], {
    pool: state.pool,
    source: "verified test counter",
  });

  assert.equal(report.checked, 1);
  assert.equal(report.inserted, 0);
  assert.equal(report.duplicates, 1);
  assert.equal(state.inserted.length, 0);
  assert.ok(state.queries.some(({ sql }) => sql === "COMMIT"));
});

test("dry run performs validation but rolls back without inserting", async () => {
  const state = makePool();
  const report = await ingestTelemetry([sample], {
    pool: state.pool,
    source: "verified test counter",
    dryRun: true,
  });

  assert.equal(report.would_insert, 1);
  assert.equal(report.inserted, 0);
  assert.equal(state.inserted.length, 0);
  assert.ok(state.queries.some(({ sql }) => sql === "ROLLBACK"));
});

test("rejects unknown buses, over-capacity counts, and conflicting history atomically", async () => {
  const unknown = makePool();
  await assert.rejects(
    ingestTelemetry([{ ...sample, bus_id: "missing" }], {
      pool: unknown.pool,
      source: "verified test counter",
    }),
    /missing a valid total_capacity/,
  );
  assert.ok(unknown.queries.some(({ sql }) => sql === "ROLLBACK"));

  const overCapacity = makePool();
  await assert.rejects(
    ingestTelemetry([{ ...sample, passenger_count: 51 }], {
      pool: overCapacity.pool,
      source: "verified test counter",
    }),
    /exceeding its capacity/,
  );
  assert.equal(overCapacity.inserted.length, 0);

  const conflict = makePool({
    existing: [{
      id: 1,
      bus_id: "bus-test",
      passenger_count: 19,
      recorded_at: "2026-02-01T11:00:00.000Z",
    }],
  });
  await assert.rejects(
    ingestTelemetry([sample], {
      pool: conflict.pool,
      source: "verified test counter",
    }),
    /Conflicting passenger_count already exists/,
  );
  assert.equal(conflict.inserted.length, 0);

  const unknownCount = makePool({
    existing: [{
      id: 1,
      bus_id: "bus-test",
      passenger_count: null,
      recorded_at: "2026-02-01T11:00:00.000Z",
    }],
  });
  await assert.rejects(
    ingestTelemetry([{ ...sample, passenger_count: 0 }], {
      pool: unknownCount.pool,
      source: "verified test counter",
    }),
    /Conflicting passenger_count already exists/,
  );
  assert.equal(unknownCount.inserted.length, 0);
});

test("requires explicit CLI acknowledgment before loading measurement files", () => {
  assert.deepEqual(
    parseArguments([
      "--input", "measurements.jsonl",
      "--source", "operator counter",
      "--confirm-real-measurements",
      "--dry-run",
    ]),
    {
      input: "measurements.jsonl",
      source: "operator counter",
      confirmed: true,
      dryRun: true,
    },
  );
  assert.throws(
    () => parseArguments(["--auto"]),
    /Unknown option/,
  );
});
