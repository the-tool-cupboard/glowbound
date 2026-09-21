const { createRequire } = require("module");

const expoRequire = createRequire(require.resolve("expo/package.json"));

/** @type {import("jest").Config} */
module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.ts"],
  // SDK 57 nests expo-modules-core under expo; jest-expo still requires it at the root.
  moduleNameMapper: {
    "^expo-modules-core$": expoRequire.resolve("expo-modules-core"),
  },
};
