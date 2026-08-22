import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";

// NOTE: TypeScript files are intentionally excluded from linting below.
// typescript-eslint does not yet support TypeScript 7.0 (native/Go compiler);
// see https://github.com/typescript-eslint/typescript-eslint/issues/10940.
// Re-enable TS linting once that lands (or reintroduce typescript-eslint
// with a pinned TS 6.x devDependency in the meantime).
export default [
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "**/*.min.js",
      "README.md",
      ".claude/**",
      "src/**/*.md",
      "test/**/*.md",
      "**/*.ts",
      "**/*.tsx",
      "**/*.mts",
      "**/*.cts",
      "**/*.d.ts",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.json"],
    language: "json/json",
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
  ...markdown.configs.recommended,
  {
    files: ["**/*.md", "**/*.md/*.js"],
    rules: {
      "no-unused-expressions": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
    rules: {
      "no-unused-expressions": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.css"],
    ...css.configs.recommended,
  },
  {
    files: ["test/**/*.{js,jsx}"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["bench/**/*.{js,jsx,mjs,cjs}"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    rules: {
      "no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
      }],
      "no-unused-expressions": "warn",
      "no-undef": "warn",
      "no-console": "warn",
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
  },
];
