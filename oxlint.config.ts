import solidV2 from "eslint-plugin-solid/configs/v2";
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["eslint-plugin-solid"],
  ignorePatterns: ["**/*.gen.*", "dist", "styled-system", "src/module_bindings"],
  settings: solidV2.settings,
  rules: solidV2.rules,
});
