import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 15000,
    hookTimeout: 15000,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/__tests__/**/*.test.js"],
    fileParallelism: false,
    env: {
      DB_NAME: "cms_test_db",
      SSO_SECRET_KEY: "0123456789abcdef",
    },
  },
});
