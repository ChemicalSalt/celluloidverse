import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      sourceType: "commonjs", // since you're using require in backend
      globals: {
        ...globals.browser,   // frontend (browser globals like window, document)
        ...globals.node,      // backend (require, process, __dirname)
      },
    },
    rules: {
      ...js.configs.recommended.rules, // include recommended JS rules
    },
  },
]);
