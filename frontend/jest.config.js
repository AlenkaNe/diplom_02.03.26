module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'public/*-logic.js',
    'server.js',
  ],
  // pg-mem интеграционные тесты тяжелее и могут быть чуть медленнее
  testTimeout: 30000,
  coverageReporters: ['text', 'text-summary'],
};

