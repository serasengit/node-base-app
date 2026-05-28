const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname
});

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', '.nyc_output/**', 'eslint.config.js']
  },
  ...compat.config(require('./.eslintrc.json'))
];
