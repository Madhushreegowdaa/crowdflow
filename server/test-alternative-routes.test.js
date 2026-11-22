const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { test, before, after } = require("node:test");
const { createAlternativeBusRouter } = require("./routes/alternativeBusRoutes");

const expectedData = {
  boarding_stop: "Market",
  destination: "University",
  alternatives: [],
  message: "No less-crowded alternative bus is currently available.",
};
let receivedRequest;
let server;
let baseUrl;

const app = express();
app.use(express.json());
app.use(
  "/api/analytics/buses",
  createAlternativeBusRouter(async (destination, options) => {
    receivedRequest = { destination, options };
    return expectedData;
  }),
);

before(
  () =>
    new Promise((resolve, reject) => {
      server = http.createServer(app);
      server.listen(0, "127.0.0.1", () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
      server.on("error", reject);
    }),
);

after(() => new Promise((resolve) => server.close(resolve)));

function post(payload) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      `${baseUrl}/api/analytics/buses/alternatives`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      (response) => {
        let body = "";
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () => resolve({
          status: response.statusCode,
          body: JSON.parse(body),
        }));
      },
    );
    request.on("error", reject);
    request.end(JSON.stringify(payload));
  });
}

test("alternative API requires actual boarding and destination stops", async () => {
  const { status, body } = await post({ target_destination: "University" });

  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /boarding stop and target destination/i);
});

test("alternative API forwards the passenger-selected stops and wraps the result", async () => {
  const { status, body } = await post({
    boarding_stop: "Market",
    target_destination: "University",
    exclude_bus_id: "bus-selected",
  });

  assert.equal(status, 200);
  assert.deepEqual(receivedRequest, {
    destination: "University",
    options: {
      aiEngineUrl: process.env.AI_ENGINE_URL || "http://127.0.0.1:8000",
      boardingStop: "Market",
      excludeBusId: "bus-selected",
    },
  });
  assert.deepEqual(body, { success: true, data: expectedData });
});
