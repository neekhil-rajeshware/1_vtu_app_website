import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Every place this fires is either a one-off load from Supabase when a
      // dashboard screen opens, a read of localStorage/`mounted` for the theme,
      // or closing the mobile menu when the route changes. Those are exactly
      // the "synchronise with an external system" cases the rule allows, but it
      // cannot tell them apart from a render loop, so it flags them all.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
