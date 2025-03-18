module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/simple*.test.ts'],
  transform: {
    '^.+\\.(ts|js)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@prisma)',
  ],
};
