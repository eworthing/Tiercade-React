import type { Config } from "jest";
import { createDefaultPreset } from "ts-jest";

const config: Config = {
  ...createDefaultPreset(),
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleNameMapper: {
    // Stub CSS imports (Spectrum S2 ships CSS in CJS bundles)
    "\\.(css|less|scss|sass)$": "<rootDir>/../../packages/ui/test/__mocks__/fileMock.js",
  },
};

export default config;
