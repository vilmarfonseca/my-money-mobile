// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // `src/lib` is synced from the web repo (see scripts/sync-web.mjs) and is
    // linted there; only the file this repo owns in it is checked here.
    ignores: ['dist/*', 'src/lib/**', '!src/lib/i18n/provider.tsx'],
  },
]);
