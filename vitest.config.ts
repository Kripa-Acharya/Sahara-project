import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: "./tests/global-setup.ts",
    setupFiles: ["./tests/setup-env.ts"],
    // Server actions hit one shared SQLite test database — run serially.
    fileParallelism: false,
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Next.js request APIs don't exist outside the server runtime — use stubs.
      "next/headers": path.resolve(__dirname, "tests/stubs/next-headers.ts"),
      "next/navigation": path.resolve(__dirname, "tests/stubs/next-navigation.ts"),
      "next/cache": path.resolve(__dirname, "tests/stubs/next-cache.ts"),
    },
  },
});
