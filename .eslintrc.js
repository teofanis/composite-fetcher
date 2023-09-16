module.exports = {
  root: true,
  extends: ['@composite-fetcher/eslint-config'],
  settings: {
    next: {
      rootDir: ['apps/*/'],
    },
  },
};
