# CrowdFlow client

The Next.js client is a frontend demonstration scoped to Bengaluru, Dakshina Kannada, Udupi, and Shivamogga.

## Data coverage

- The bundled route, arrival, crowd, and tracking values are mock data. They are not verified operator services, schedules, live bus positions, or crowd readings.
- The stop directory contains a partial Bengaluru list. Dakshina Kannada, Udupi, and Shivamogga entries are area references only, not verified terminals or pickup stops.
- The map uses illustrative stop coordinates and simulated positions; it does not show verified road geometry or live GPS.
- No complete official route, terminal, or timetable feed for these areas is connected.

## Run locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validate

```bash
npm run lint
npm run build
```
