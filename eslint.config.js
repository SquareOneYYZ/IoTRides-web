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

const sharedRules = {
  'react/react-in-jsx-scope': 'off',
  'no-console': 'warn',
  'comma-dangle': ['error', 'always-multiline'],
  'operator-linebreak': ['error', 'before'],
  'function-paren-newline': ['error', 'consistent'],
  'arrow-body-style': ['error', 'as-needed'],
  'import/no-duplicates': 'error',
  'max-len': 'off',
  'no-shadow': 'off',
  'no-return-assign': 'off',
  'no-param-reassign': 'off',
  'no-prototype-builtins': 'off',
  'object-curly-newline': [
    'warn',
    {
      ObjectExpression: { minProperties: 8, multiline: true, consistent: true },
      ObjectPattern: { minProperties: 8, multiline: true, consistent: true },
      ImportDeclaration: {
        minProperties: 4,
        multiline: true,
        consistent: true,
      },
      ExportDeclaration: {
        minProperties: 4,
        multiline: true,
        consistent: true,
      },
    },
  ],
  'import/no-unresolved': ['warn', { ignore: ['\\.svg', 'virtual:'] }],
  'react/function-component-definition': [
    'warn',
    {
      namedComponents: 'arrow-function',
      unnamedComponents: 'arrow-function',
    },
  ],
  'react/jsx-props-no-spreading': 'off',
  'react/jsx-uses-vars': 'error',
  'jsx-a11y/anchor-is-valid': 'off',
  'jsx-a11y/label-has-associated-control': 'off',
  'react/prop-types': 'off',
};

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.min.js',
      'legacy/**',
    ],
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
    rules: sharedRules,
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
