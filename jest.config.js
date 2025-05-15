// jest.config.js (Recomendado Final)
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'], // Correto, pois seu setup-jest.ts está na raiz
  transform: {
    '^.+\.(ts|js|html|mjs)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\.(html|svg)$',
        // isolatedModules: true, // REMOVIDO DESTA SEÇÃO
        useESM: true, // jest-preset-angular v13+ usa ESM por padrão
      },
    ],
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  coverageReporters: ['html', 'lcov', 'text-summary'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts'],
};
