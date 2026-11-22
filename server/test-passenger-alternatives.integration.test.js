const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");
const express = require("express");
const { after, test } = require("node:test");
const { createAlternativeBusRouter } = require("./routes/alternativeBusRoutes");
const { requestAlternativeBuses } = require("./services/bus-records");

const python = path.resolve(__dirname, "..", "ai-engine", ".venv", "Scripts", "python.exe");
const aiDirectory = path.resolve(__dirname, "..", "ai-engine");
const passengerInput = {
  boarding_stop: "Corporation / Hudson Circle",
  target_destination: "ITPL / Whitefield TTMC",
  exclude_bus_id: "bus-335e-1",
};
const buses = [
  {
    id: "bus-335e-1",
    bus_number: "335-E",
    route_name: "Majestic to Whitefield via HAL",
    category: "Standard",
    crowd_level: "high",
    occupancy_percent: 88,
    fare: 20,
    next_arrival_mins: 3,
    stops: [
      { name: "Majestic Bus Station" },
      { name: "Corporation / Hudson Circle" },
      { name: "Richmond Circle" },
      { name: "Domlur TTMC" },
      { name: "HAL Main Gate" },
      { name: "Marathahalli Bridge" },
      { name: "Kundalahalli Gate" },
      { name: "ITPL / Whitefield TTMC" },
    ],
  },
  {
    id: "bus-k3-alt",
    bus_number: "K-3 Rapid",
    route_name: "Corporation to ITPL Express",
    category: "City Fast Corridor",
    crowd_level: "moderate",
    occupancy_percent: 58,
    fare: 30,
    next_arrival_mins: 6,
    stops: [
      { name: "Corporation / Hudson Circle" },
      { name: "Richmond Circle" },
      { name: "Domlur TTMC" },
      { name: "Marathahalli Bridge" },
      { name: "ITPL / Whitefield TTMC" },
    ],
  },
  {
    id: "bus-500d-1",
    bus_number: "500-D",
    route_name: "Silk Board to KR Puram via Marathahalli",
    category: "Vajra AC Electric",
    crowd_level: "low",
    occupancy_percent: 26,
    fare: 35,
    next_arrival_mins: 1,
    stops: [
      { name: "Silk Board Junction" },
      { name: "HSR Layout 14th Main" },
      { name: "Bellandur Central Mall" },
      { name: "Devarabeesanahalli (Ecospace)" },
      { name: "Kadubeesanahalli" },
      { name: "Marathahalli Bridge" },
      { name: "KR Puram Railway Station" },
      { name: "Tin Factory Junction" },
    ],
  },
  {
    id: "bus-kia8-1",
    bus_number: "KIA-8",
    route_name: "Electronic City to Kempegowda Intl Airport Express",
    category: "Airport Express",
    crowd_level: "low",
    occupancy_percent: 18,
    fare: 25,
    next_arrival_mins: 12,
    stops: [
      { name: "Electronic City Tollgate" },
      { name: "Silk Board Junction" },
      { name: "Devarabeesanahalli (Ecospace)" },
      { name: "Marathahalli Bridge" },
      { name: "KR Puram Railway Station" },
      { name: "Hebbal Flyover" },
      { name: "Kempegowda Intl Airport (Terminal 1)" },
    ],
  },
];

let aiProcess;
let expressServer;
let previousAiUrl;

after(async () => {
  if (expressServer) {
    await new Promise((resolve) => expressServer.close(resolve));
  }
  if (aiProcess && aiProcess.exitCode === null) {
    aiProcess.kill();
  }
  if (previousAiUrl === undefined) delete process.env.AI_ENGINE_URL;
  else process.env.AI_ENGINE_URL = previousAiUrl;
});

async function reservePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  const { port } = listener.address();
  await new Promise((resolve) => listener.close(resolve));
  return port;
}

async function waitForAi(url, processHandle) {
  const deadline = Date.now() + 15000;
  let lastError;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`FastAPI exited before becoming ready (code ${processHandle.exitCode}).`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`FastAPI did not become ready: ${lastError?.message || "startup timed out"}`);
}

test("returns a suitable shared-fleet alternative and excludes the selected bus through Express and FastAPI", async () => {
  const aiPort = await reservePort();
  const aiUrl = `http://127.0.0.1:${aiPort}`;
  aiProcess = spawn(
    python,
    ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", String(aiPort)],
    { cwd: aiDirectory, stdio: "ignore" },
  );
  await waitForAi(aiUrl, aiProcess);
  previousAiUrl = process.env.AI_ENGINE_URL;
  process.env.AI_ENGINE_URL = aiUrl;

  const busClient = {
    from(table) {
      assert.equal(table, "buses");
      return {
        async select(columns) {
          assert.equal(columns, "*");
          return { data: buses, error: null };
        },
      };
    },
  };
  const app = express();
  app.use(express.json());
  app.use(
    "/api/analytics/buses",
    createAlternativeBusRouter((destination, options) =>
      requestAlternativeBuses(destination, {
        ...options,
        busClient,
      }),
    ),
  );
  expressServer = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    expressServer.once("listening", resolve);
    expressServer.once("error", reject);
  });

  const response = await fetch(
    `http://127.0.0.1:${expressServer.address().port}/api/analytics/buses/alternatives`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passengerInput),
    },
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.equal(result.data.boarding_stop, passengerInput.boarding_stop);
  assert.equal(result.data.destination, passengerInput.target_destination);
  assert.deepEqual(
    result.data.alternatives.map((bus) => bus.bus_id),
    ["bus-k3-alt"],
  );

  const trackedAlternativeResponse = await fetch(
    `http://127.0.0.1:${expressServer.address().port}/api/analytics/buses/alternatives`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...passengerInput,
        exclude_bus_id: "bus-k3-alt",
      }),
    },
  );
  const trackedAlternativeResult = await trackedAlternativeResponse.json();

  assert.equal(trackedAlternativeResponse.status, 200);
  assert.deepEqual(trackedAlternativeResult.data.alternatives, []);
  assert.equal(
    trackedAlternativeResult.data.message,
    "No less-crowded alternative bus is currently available.",
  );

  const incompatibleBoardingResponse = await fetch(
    `http://127.0.0.1:${expressServer.address().port}/api/analytics/buses/alternatives`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...passengerInput,
        boarding_stop: "HAL Main Gate",
      }),
    },
  );
  const incompatibleBoardingResult = await incompatibleBoardingResponse.json();

  assert.equal(incompatibleBoardingResponse.status, 200);
  assert.deepEqual(incompatibleBoardingResult.data.alternatives, []);
  assert.equal(
    incompatibleBoardingResult.data.message,
    "No less-crowded alternative bus is currently available.",
  );
});
