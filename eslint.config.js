import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

const cleanGlobals = (globalsObj) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(globalsObj)) {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      cleaned[trimmedKey] = value;
    }
  }
  return cleaned;
};

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '*.min.js'],
  },
  {
    files: ['legacy/**/*.js'],
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: 'script',
      globals: {
        ...cleanGlobals(globals.browser),
        Ext: 'readonly',
        Traccar: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'comma-dangle': ['error', 'never'],
      'operator-linebreak': 'off',
      'function-paren-newline': 'off',
      'arrow-body-style': 'off',
      'import/no-duplicates': 'off',
    },
  },
  {
    files: ['src/**/*.{js,jsx}', '*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...cleanGlobals(globals.browser),
        ...cleanGlobals(globals.node),
      },
    },
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'no-console': 'warn',
      'comma-dangle': ['error', 'always-multiline'],
      'operator-linebreak': ['error', 'before'],
      'function-paren-newline': ['error', 'consistent'],
      'arrow-body-style': ['error', 'as-needed'],
      'import/no-duplicates': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
