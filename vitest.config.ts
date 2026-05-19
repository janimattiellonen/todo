import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import stylex from "vite-plugin-stylex";
import { defineConfig } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const stylexPlugin = stylex({
  aliases: {
    "~/*": [path.resolve(__dirname, "app", "*")],
  },
});

const resolveAlias = {
  "~": path.resolve(__dirname, "app"),
};

export default defineConfig({
  test: {
    env: loadEnv("test", process.cwd(), ""),
    projects: [
      {
        plugins: [stylexPlugin],
        resolve: { alias: resolveAlias },
        test: {
          name: "Unit tests",
          environment: "jsdom",
          include: ["app/**/*.unit.test.{ts,tsx}"],
          setupFiles: ["./app/test/unit/setup.ts"],
          isolate: false,
          fileParallelism: true,
        },
      },
      {
        plugins: [stylexPlugin],
        resolve: { alias: resolveAlias },
        test: {
          name: "Integration tests",
          include: ["app/**/*.integration.test.{ts,tsx}"],
          globalSetup: ["./app/test/integration/globalSetup.ts"],
          setupFiles: ["./app/test/integration/setup.ts"],
          isolate: true,
          fileParallelism: false,
        },
      },
    ],
  },
});
