import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tooling / non-app sources — not part of the application lint surface:
    ".claude/**", // Takumi/Sixth agent-kit scripts (.cjs, require()-style)
    "**/.venv/**", // Python virtualenvs (e.g. .claude/skills/.venv)
    "coverage/**",
    "specs/generated/**", // Sungen-compiled output + runtime fixtures (auto-generated, "DO NOT EDIT")
  ]),
  {
    // Test files & setup: relax rules that legitimately appear in test mocks
    // (typed-`any` stubs, `require()` for module mocking, throwaway locals).
    files: ["**/*.test.{ts,tsx}", "vitest.setup.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Inline-style guard: warn devs away from new `style` props.
    // eslint-plugin-react is registered by eslint-config-next/core-web-vitals (plugin key "react").
    // WARN (not error) so CI stays green; warning count decreases as remaining files migrate.
    // For runtime-dynamic inline styles that must stay, add above the line:
    //   // dynamic: <reason>
    //   // eslint-disable-next-line react/forbid-dom-props
    // See docs/styling-conventions.md for the full convention.
    name: "saa/inline-style-guard",
    rules: {
      "react/forbid-dom-props": [
        "warn",
        {
          forbid: [
            {
              propName: "style",
              message:
                "Use Tailwind utility + @theme token. Inline style only for runtime-dynamic values — add eslint-disable-next-line with a // dynamic: reason. See docs/styling-conventions.md",
            },
          ],
        },
      ],
      "react/forbid-component-props": [
        "warn",
        {
          forbid: [
            {
              propName: "style",
              message:
                "Prefer className + tokens; see docs/styling-conventions.md",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
