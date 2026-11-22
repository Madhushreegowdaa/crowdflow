export function getCrowdflowApiUrl(path: string): URL {
  const baseUrl =
    process.env.CROWDFLOW_API_BASE_URL ??
    process.env.ADMIN_API_BASE_URL ??
    "http://127.0.0.1:5000";

  return new URL(path, baseUrl);
}
