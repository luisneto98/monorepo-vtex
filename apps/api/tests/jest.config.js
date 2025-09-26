module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../',
  testEnvironment: 'node',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts',
  ],
  coverageDirectory: '../coverage',
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../../../packages/shared/src/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
  },
  testTimeout: 10000,
};