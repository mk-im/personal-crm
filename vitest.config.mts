import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

const src = path.resolve(root, "src");

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: `${src}/` }],
  },
  test: {
    environment: "node",
    passWithNoTests: true,
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
  },
});
