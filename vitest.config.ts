import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirror tsconfig's `"@/*": ["./src/*"]` so tests can import modules that
  // runtime-import "@/data" / "@/engine" / "@/lib/*" (Phase 5 Pitfall 7).
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
