const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  getBusRecords,
  mapBusRecord,
  requestAlternativeBuses,
} = require("./services/bus-records");

function makeBusRecord(overrides = {}) {
  return {
    id: "bus-1",
    bus_number: "101",
    route_name: "North Route",
    category: "Standard",
    crowd_level: "LOW",
    occupancy_percent: "42.5",
    fare: "30",
    next_arrival_mins: "6",
    stops: [
      { id: "stop-1", name: "Central", scheduledTime: "08:00" },
      { id: "stop-2", name: "University", scheduledTime: "08:20" },
    ],
    ...overrides,
  };
}

function makeSupabaseClient(data, error = null) {
  const calls = { tables: [], selections: [] };
  return {
    calls,
    from(table) {
      calls.tables.push(table);
      return {
        async select(columns) {
          calls.selections.push(columns);
          return { data, error };
        },
      };
    },
  };
}

test("maps database bus fields and preserves ordered stop names", () => {
  assert.deepEqual(mapBusRecord(makeBusRecord()), {
    bus_id: "bus-1",
    bus_number: "101",
    route_name: "North Route",
    category: "Standard",
    destination: "University",
    crowd_level: "Low",
    occupancy_percent: 42.5,
    fare: 30,
    eta_minutes: 6,
    stops: ["Central", "University"],
  });
});

test("normalizes medium crowd level without inventing fields", () => {
  const mapped = mapBusRecord(makeBusRecord({ crowd_level: "mEdIuM" }));

  assert.equal(mapped.crowd_level, "Moderate");
  assert.equal(Object.hasOwn(mapped, "route_id"), false);
});

test("accepts JSON-encoded stops and rejects records missing real ETA data", () => {
  const mapped = mapBusRecord(
    makeBusRecord({ stops: '[{"name":"First"},{"name":"Last"}]' })
  );
  assert.deepEqual(mapped.stops, ["First", "Last"]);
  assert.equal(mapped.destination, "Last");

  assert.throws(
    () => mapBusRecord(makeBusRecord({ next_arrival_mins: null })),
    /missing next_arrival_mins/
  );
});

test("rejects bus records that cannot provide a destination from actual stops", () => {
  assert.throws(
    () => mapBusRecord(makeBusRecord({ stops: [] })),
    /no destination can be derived from empty stops/
  );
});

test("reads and maps buses from the shared Supabase fleet", async () => {
  const busClient = makeSupabaseClient([makeBusRecord()]);

  const buses = await getBusRecords(busClient);

  assert.deepEqual(busClient.calls.tables, ["buses"]);
  assert.deepEqual(busClient.calls.selections, ["*"]);
  assert.equal(buses.length, 1);
  assert.equal(buses[0].eta_minutes, 6);
});

test("surfaces Supabase bus-read errors instead of returning an empty fleet", async () => {
  const busClient = makeSupabaseClient(null, new Error("bus read unavailable"));

  await assert.rejects(getBusRecords(busClient), /bus read unavailable/);
});

test("posts mapped records to the existing FastAPI endpoint", async () => {
  let calledUrl;
  let calledOptions;
  const expectedResponse = { alternatives: [], message: "No alternatives." };
  const busClient = makeSupabaseClient([
    makeBusRecord({
      stops: [{ name: "Market" }, { name: "University" }],
    }),
  ]);

  const result = await requestAlternativeBuses("University", {
    aiEngineUrl: "http://ai-engine:8000",
    boardingStop: "Market",
    excludeBusId: "bus-selected",
    busClient,
    async fetchImpl(url, options) {
      calledUrl = String(url);
      calledOptions = options;
      return { ok: true, async json() { return expectedResponse; } };
    },
  });

  assert.equal(calledUrl, "http://ai-engine:8000/api/buses/alternatives");
  assert.equal(calledOptions.method, "POST");
  assert.deepEqual(JSON.parse(calledOptions.body), {
    target_destination: "University",
    boarding_stop: "Market",
    exclude_bus_id: "bus-selected",
    buses: [
      mapBusRecord(
        makeBusRecord({
          stops: [{ name: "Market" }, { name: "University" }],
        }),
      ),
    ],
  });
  assert.deepEqual(result, expectedResponse);
});

test("requires a passenger-selected boarding stop", async () => {
  await assert.rejects(
    requestAlternativeBuses("University", {
      aiEngineUrl: "http://ai-engine:8000",
      busClient: makeSupabaseClient([]),
    }),
    /boarding stop/,
  );
});
