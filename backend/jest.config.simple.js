module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/examples/simple*.test.ts'],
  transform: {
    '^.+\\.(ts|js)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@prisma)',
  ],
};
