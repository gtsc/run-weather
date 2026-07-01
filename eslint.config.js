import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

// Svelte 5 rune globals for .svelte.ts store files
const svelteRunes = {
  $state: 'readonly',
  $derived: 'readonly',
  $props: 'readonly',
  $bindable: 'readonly',
  $effect: 'readonly',
  $inspect: 'readonly',
  $host: 'readonly',
};

export default [
  js.configs.recommended,
  ...svelte.configs['flat/recommended'],
  // TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
      },
    },
  },
  // Svelte rune store files (.svelte.ts)
  {
    files: ['**/*.svelte.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...svelteRunes,
      },
    },
  },
  // Svelte files with TypeScript inside
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
      globals: {
        ...globals.browser,
      },
    },
  },
  // Node.js scripts and lab
  {
    files: ['lab/**/*.ts', 'scripts/**/*.mjs', 'scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Cloudflare Worker entry (ambient runtime types from @cloudflare/workers-types)
  {
    files: ['src/server/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ScheduledController: 'readonly',
      },
    },
  },
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Empty catch blocks are intentional (e.g. localStorage fallbacks)
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Local computation variables (Map, Date) inside reactive functions
      // are not the same as reactive state — disable false positives
      'svelte/prefer-svelte-reactivity': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '.svelte-kit/', '.worktrees/', 'scriptable/'],
  },
];
