import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";

export default [
  {
    ignores: [".vite/", "dist/"],
  },
  pluginJs.configs.recommended,
  {
    ...pluginReactConfig,
    languageOptions: {
        ...pluginReactConfig.languageOptions,
        globals: globals.browser
    },
    settings: {
        react: {
            version: "detect"
        }
    },
    rules: {
        ...pluginReactConfig.rules,
        "react/react-in-jsx-scope": "off",
        "react/jsx-uses-react": "off",
        "react/prop-types": "off"
    }
  }
];