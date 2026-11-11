import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // A leading underscore marks a value that is deliberately discarded.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // Presentation code reaches content and booking only through src/server/services.ts.
    files: ["src/app/**", "src/features/**", "src/components/**", "src/seo/**"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/integrations/*", "@/integrations/**", "@/content/properties", "@/content/properties/*"],
              message: "Get content and booking from getServices() in @/server/services, never from an implementation.",
            },
          ],
        },
      ],
    },
  },
  {
    // The domain stays framework-free so it can be reused outside Next.js and run in plain Node.
    files: ["src/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["react", "react-dom", "next", "next/*", "@/*"], message: "src/domain must stay pure TypeScript with relative imports." }] },
      ],
    },
  },
  {
    // Environment variables are read in one place, so configuration is validated once and secrets are easy to audit.
    files: ["src/**"],
    ignores: ["src/config/env.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "MemberExpression[object.name='process'][property.name='env']", message: "Read configuration from @/config/env." },
      ],
    },
  },
  // chrome-profile: headless browser profiles written by the QA scripts (git-ignored too).
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "**/chrome-profile/**"]),
]);

export default eslintConfig;
