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
    // Supabase Edge Functions are Deno — not linted by Next.js ESLint
    "supabase/functions/**",
    // Migration SQL files
    "supabase/migrations/**",
  ]),
  // Project-wide rule overrides
  {
    rules: {
      // Services use Supabase's dynamic SupabaseClient which ships as 'any' at the
      // call-site abstraction layer. Disabling per-file via comments would be more
      // noise than benefit; we allow it project-wide for now.
      "@typescript-eslint/no-explicit-any": "off",

      // Underscore-prefixed params are intentionally unused (e.g. _req, _client)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Allow empty catch blocks (fire-and-forget patterns)
      "@typescript-eslint/no-empty-object-type": "off",

      // Supabase typed queries return unknown shapes — allow unsafe member access
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",

      // Dynamic images in hotel CMS use arbitrary URLs
      "@next/next/no-img-element": "warn",

      // Consistent import style
      "no-console": ["warn", { allow: ["error", "warn", "info"] }],

      // ── React Compiler rules (experimental) ───────────────────────────
      // set-state-in-effect: flags standard data-fetching effects where
      // setState is called inside an async function invoked from useEffect.
      // This is a valid and common pattern in React — disable to avoid
      // false positives on all hooks.
      "react-hooks/set-state-in-effect": "off",

      // preserve-manual-memoization: fires when useCallback deps use optional
      // chaining (user?.id). This is a false positive — disable.
      "react-hooks/preserve-manual-memoization": "off",

      // Unescaped entities in JSX — off for CMS content and dynamic strings
      "react/no-unescaped-entities": "off",

      // React Compiler: static-components fires when a component is defined
      // inside a render function (inline components). This is common in wizard
      // steps and data-dense pages. Disable to avoid false positives.
      "react-hooks/static-components": "off",

      // React Compiler: incompatible-library fires on React Hook Form's watch()
      // and similar third-party APIs. These are safe and standard usage.
      "react-hooks/incompatible-library": "off",

      // img elements: hotel CMS uses Supabase Storage URLs that work fine with
      // HTML img; next/image requires explicit width/height which isn't always
      // available for user-uploaded content.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
