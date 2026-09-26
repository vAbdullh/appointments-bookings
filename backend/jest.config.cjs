module.exports = {
  testEnvironment: 'node',
  testRegex: '.e2e-spec.js$',
  rootDir: 'dist-test/test',
  globalSetup: '../../test/global-setup.cjs',
  testTimeout: 30000
};
