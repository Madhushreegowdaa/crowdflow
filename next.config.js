/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        // Treat Member4's side-effect CSS module as global CSS, while keeping admin CSS modules mapped.
        condition: { not: { path: /src\/app\/admin\/.*\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;