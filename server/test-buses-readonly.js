const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = () => {};
console.error = () => {};

let pool;

async function main() {
  try {
    pool = require("./config/db");
    const result = await pool.query(
      "SELECT id, bus_number, route_name, crowd_level, occupancy_percent, current_passengers, total_capacity, stops FROM public.buses LIMIT 5;"
    );

    originalConsoleLog(JSON.stringify(result.rows, null, 2));
  } catch {
    process.exitCode = 1;
  } finally {
    try {
      if (pool) {
        await pool.end();
      }
    } finally {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    }
  }
}

main();