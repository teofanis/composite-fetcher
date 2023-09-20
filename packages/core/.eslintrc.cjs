module.exports = {
  root: true,
  extends: ['@composite-fetcher/eslint-config/base'],
  parserOptions: {
    project: ['packages/core/tsconfig.json', './tsconfig.json'],
  },
};
