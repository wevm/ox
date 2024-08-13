import jsdoc from 'eslint-plugin-jsdoc'
import tseslint from 'typescript-eslint'

export default {
  files: ['**/*.ts'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { sourceType: 'module' },
  },
  plugins: {
    jsdoc,
  },
  rules: {
    'jsdoc/require-jsdoc': 'error',
    'jsdoc/require-description': 'error',
    'jsdoc/require-example': 'error',
  },
  settings: {
    jsdoc: {
      ignoreInternal: true,
    },
  },
}
