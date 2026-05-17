import type { Config } from "jest";
import { createDefaultPreset } from "ts-jest";

const config: Config = {
  ...createDefaultPreset(),
  testEnvironment: "jsdom",
  roots: ["<rootDir>/test"],
  setupFilesAfterEnv: ["<rootDir>/test/setupTests.ts"],
  // @react-spectrum/s2 .cjs files require() .css files (e.g. Accordion.css uses @layer).
  // Jest cannot evaluate native CSS; stub them out so the require() calls succeed.
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/test/__mocks__/fileMock.js"
  }
};

export default config;

