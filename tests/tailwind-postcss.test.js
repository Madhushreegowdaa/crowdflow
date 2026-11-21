import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("Tailwind PostCSS plugin", () => {
  it("resolves the package entry point required by Next builds", () => {
    expect(() => require.resolve("@tailwindcss/postcss")).not.toThrow();
  });
});
