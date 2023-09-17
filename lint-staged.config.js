module.exports = {
  '*.{js,jsx,ts,tsx}': ['pwd', 'pnpm run lint'],
  '*.ts?(x)': () => ['pwd', 'pnpm run check:types'],
  '*.{json,yaml}': ['pwd', 'pnpm run format'],
};
