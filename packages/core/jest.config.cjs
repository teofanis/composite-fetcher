module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  resetModules: false,
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,jsx,ts,tsx}',
    '!<rootDir>/src/**/_*.{js,jsx,ts,tsx}',
    '!<rootDir>/src/**/index.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  testPathIgnorePatterns: ['testUtils.ts'],
  transformIgnorePatterns: [],
  coverageReporters: ['json-summary', 'text', 'lcov'],
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'jsdom',
};
