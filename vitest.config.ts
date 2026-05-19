import path from "node:path";
import { fileURLToPath } from "node:url";
import stylex from "vite-plugin-stylex";
import { defineConfig } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const stylexPlugin = stylex({
  aliases: {
    "~/*": [path.resolve(__dirname, "app", "*")],
  },
});

export default defineConfig({
  plugins: [stylexPlugin],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
  },
  test: {
    include: ["app/**/*.unit.test.{ts,tsx}"],
  },
});
