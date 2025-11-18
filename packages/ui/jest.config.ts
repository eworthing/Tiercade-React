import type { Config } from "jest";
import { createDefaultPreset } from "ts-jest";

const config: Config = {
  ...createDefaultPreset(),
  testEnvironment: "jsdom",
  roots: ["<rootDir>/test"],
  setupFilesAfterEnv: ["<rootDir>/test/setupTests.ts"]
};

export default config;

