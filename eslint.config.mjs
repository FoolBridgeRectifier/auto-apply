import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // This is what you wanted: show error for unused variables
      "@typescript-eslint/no-unused-vars": "error",
      "no-unused-vars": "off", // Turn off base rule to avoid duplication
      'no-empty': 'off',
    },
  },
  prettier // Must be last to disable formatting conflicts
);