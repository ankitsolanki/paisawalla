export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  testPathIgnorePatterns: ['/node_modules/', 'setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/App.jsx',
    '!src/**/*.test.{js,jsx}',
    '!src/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};

