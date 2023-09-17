
module.exports = {
  extends: ['./base', 'next'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'react/jsx-filename-extension': [
      2,
      { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    ],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        endOfLine: 'auto',
      },
    ],
  },
  parserOptions: {
    babelOptions: {
      presets: [require.resolve('next/babel')],
    },
  },
};
