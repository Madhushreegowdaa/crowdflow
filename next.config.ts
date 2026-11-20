import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      // Member 4's committed auth styles use global class names from a side-effect import.
      // Keep that behavior, while allowing admin stylesheets to use mapped CSS Module classes.
      "*.css": {
        condition: { not: { path: /src\/app\/admin\/styles\/.*\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
