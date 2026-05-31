import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";

export default [
  {
    ignores: ["dist/**", "coverage/**", "**/*.min.js", "README.md", ".claude/**", "src/**/*.md", "test/**/*.md"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  ...tseslint.configs.recommended.map((config) =>
    config.files ? config : { ...config, files: ["**/*.{js,mjs,cjs,ts,mts,cts}"] },
  ),
  {
    files: ["**/*.ts", "**/*.d.ts"],
    rules: {
      "no-undef": "off",
    },
  },
  {
    files: ["test/**/*.{ts,tsx,js,jsx}", "types/**/*.{ts,d.ts}"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  {
    files: ["test/helpers/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  {
    files: ["src/style/styleBuilder.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
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
    files: ["**/*.md", "**/*.md/*.js", "**/*.md/*.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-expressions": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-expressions": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.css"],
    ...css.configs.recommended,
  },
  {
    files: ["**/*.{ts,mts,cts,tsx}", "**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
      }],
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-console": "warn",
    },
  },
  {
    files: ["test/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
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
