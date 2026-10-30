import { builtinModules } from 'node:module'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin
    },
    settings: {
      react: {
        version: '19.0'
      }
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off'
    }
  },
  {
    // The packages ship only ES modules, which CommonJS consumers load with
    // require(). Node cannot require() a module graph that contains a
    // top-level await, so the published code must not use one.
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'AwaitExpression:not(:function AwaitExpression)',
          message: 'Top-level await breaks require() of the published ES modules.'
        },
        {
          selector: 'ForOfStatement[await=true]:not(:function ForOfStatement)',
          message: 'Top-level for await breaks require() of the published ES modules.'
        },
        {
          selector: 'VariableDeclaration[kind="await using"]:not(:function VariableDeclaration)',
          message: 'Top-level await using breaks require() of the published ES modules.'
        }
      ]
    }
  },
  {
    // The core runs outside Node too, such as in edge runtimes and workers,
    // so it must not import Node's built-in modules.
    files: ['packages/core/src/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*'],
              message: 'The core must run outside Node: do not import Node built-in modules.'
            }
          ],
          paths: builtinModules.map(name => ({
            name,
            message: 'The core must run outside Node: do not import Node built-in modules.'
          }))
        }
      ]
    }
  },
  {
    // The router and the middleware entries, and the files they import, run
    // outside Node, so they must not use the globals that only Node has. So
    // does the internal entry, which the Astro middleware and the Next.js
    // proxy import.
    files: [
      'packages/core/src/router/**/*.ts',
      'packages/core/src/middleware/**/*.ts',
      'packages/core/src/internal/**/*.ts',
      'packages/core/src/config.ts',
      'packages/core/src/detectLocale.ts',
      'packages/core/src/utils.ts'
    ],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['process', 'Buffer', 'global', 'require', 'module', 'exports', '__dirname', '__filename', 'setImmediate', 'clearImmediate']
          .map(name => ({
            name,
            message: 'The router and the middleware must run outside Node: do not use Node globals.'
          }))
      ]
    }
  }
)
