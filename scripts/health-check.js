const services = [
  {
    name: 'Frontend (Next.js)',
    url: 'http://127.0.0.1:3000',
    expectedStatus: [200, 307, 308],
  },
  {
    name: 'AI Analytics Engine (FastAPI)',
    url: 'http://127.0.0.1:8000/',
    expectedStatus: [200],
  },
  {
    name: 'Backend API (Express)',
    url: 'http://127.0.0.1:5000/api/health',
    expectedStatus: [200],
  },
];

async function checkService(service) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const startTime = Date.now();
    const response = await fetch(service.url, {
      signal: controller.signal,
      headers: { Accept: 'application/json, text/html' },
    });
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    let details = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      if (json && typeof json === 'object') {
        details += ` - ${JSON.stringify(json)}`;
      }
    } catch {
      // Not JSON, that's fine for HTML routes
    }

    const isOk = service.expectedStatus.includes(response.status);
    return {
      name: service.name,
      url: service.url,
      ok: isOk,
      message: `${isOk ? 'ONLINE' : 'UNEXPECTED STATUS'} (${details}, ${duration}ms)`,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const errorMsg = err.name === 'AbortError' ? 'TIMEOUT (3000ms)' : (err.message || 'Connection refused');
    return {
      name: service.name,
      url: service.url,
      ok: false,
      message: `OFFLINE (${errorMsg})`,
    };
  }
}

async function runHealthCheck() {
  console.log('=============================================');
  console.log('       CrowdFlow Service Health Check        ');
  console.log('=============================================\n');

  let allHealthy = true;

  for (const service of services) {
    const result = await checkService(service);
    const icon = result.ok ? '✓' : '✗';
    console.log(`${icon} [${result.name}] ${result.url}`);
    console.log(`  Status: ${result.message}\n`);
    if (!result.ok) allHealthy = false;
  }

  console.log('---------------------------------------------');
  if (allHealthy) {
    console.log('All CrowdFlow services are healthy and running!\n');
    process.exit(0);
  } else {
    console.log('Notice: One or more services are currently not reachable.');
    console.log('Start all services with: npm run dev\n');
    process.exit(1);
  }
}

runHealthCheck();
