import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      sourceType: "module",
      globals: { ...globals.browser, ...globals.es2021 },
    },
    plugins: { "@typescript-eslint": tsPlugin, react: pluginReact },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginJs.configs.recommended.rules,
      // habilita regras TS (v6)
      ...tsPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      indent: ["error", "tab", { SwitchCase: 1 }],
      "no-mixed-spaces-and-tabs": ["warn", "smart-tabs"],
      "no-trailing-spaces": ["error"],
      "no-multiple-empty-lines": ["error", { max: 1 }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn"],
      "@typescript-eslint/no-explicit-any": ["off"],
      "no-undef": "off",
    },
  },
];
