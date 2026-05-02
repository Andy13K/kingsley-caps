module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // CG-09: const por defecto, no var
    'no-var': 'error',
    'prefer-const': 'error',

    // CG-08: template literals
    'prefer-template': 'error',

    // CG-03: longitud máxima de línea
    'max-len': ['warn', { code: 100, ignoreComments: true, ignoreStrings: true }],

    // CG-07: funciones pequeñas
    'max-lines-per-function': ['warn', { max: 35, skipBlankLines: true, skipComments: true }],
    'max-params': ['warn', 3],

    // CB-04: async/await
    'no-await-in-loop': 'warn',

    // Calidad general
    'no-console': 'warn',         // Usar Winston, no console.log
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
  },
};
