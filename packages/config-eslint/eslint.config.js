const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [require.resolve("@vercel/style-guide/eslint/typescript"), "eslint:recommended", "prettier", "turbo"],
  // extends: ["@vercel/style-guide/eslint/typescript", "eslint:recommended", "prettier", "turbo"].map(require.resolve),
  plugins: ["only-warn"],
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    project,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
    "dist/",
    "*.test.ts"
  ],
  overrides: [
    {
      files: ["*.js?(x)", "*.ts?(x)"],
    },
  ],
};
