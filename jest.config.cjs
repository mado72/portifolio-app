// jest.config.js (Recomendado Final)
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  transform: {
    '^.+\\.(ts|js|html|mjs)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
        useESM: true,
      },
    ],
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  coverageReporters: ['html', 'lcov', 'text-summary'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts'],
  // Inclua todos os pacotes ESM do Angular e terceiros aqui:
  transformIgnorePatterns: [
    'node_modules/(?!(lodash-es|ng2-charts|chart.js|date-fns|@angular|rxjs|@fortawesome|@ngrx|@angular-material-components|@angular/cdk|@angular/material)/)'
  ],
  moduleNameMapper: {
    // Mapeia arquivos de estilo e assets para mocks
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
    '^lodash-es$': 'lodash', // Use lodash comum para testes
  },
  extensionsToTreatAsEsm: ['.ts'],
};
