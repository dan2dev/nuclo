import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";

export default [
  {
    ignores: ["dist/**", "coverage/**", "**/*.min.js", "README.md", ".claude/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.d.ts"],
    rules: {
      "no-undef": "off",
    },
  },
  {
    files: ["**/*.json"],
    ...json.configs.recommended,
  },
  {
    files: ["**/*.jsonc"],
    ...json.configs.recommended,
    language: "json/jsonc",
  },
  {
    files: ["**/*.json5"],
    ...json.configs.recommended,
    language: "json/json5",
  },
  {
    files: ["**/*.md"],
    processor: markdown.processors.markdown,
  },
  {
    files: ["**/*.md/*.js"],
    ...markdown.configs.recommended,
  },
  {
    files: ["**/*.css"],
    ...css.configs.recommended,
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-console": "warn",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
  },
];