import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Only our app/lib/i18n/messages tests — never the .claude/ tooling's own .test.cjs suites.
    include: [
      "app/**/*.{test,spec}.{ts,tsx}",
      "lib/**/*.{test,spec}.{ts,tsx}",
      "i18n/**/*.{test,spec}.{ts,tsx}",
      "messages/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", ".claude/**", ".next/**", "dist/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
