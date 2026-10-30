import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['dist/**', '.astro/**'],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...astro.configs['flat/recommended'],
	{
		files: ['**/*.{astro,js,mjs,ts}'],
		plugins: {
			'@stylistic': stylistic,
		},
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'@stylistic/comma-dangle': ['error', 'always-multiline'],
			'@stylistic/eol-last': ['error', 'always'],
			'@stylistic/indent': ['error', 'tab', { SwitchCase: 1 }],
			'@stylistic/key-spacing': ['error', { afterColon: true, beforeColon: false }],
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
			'@stylistic/semi': ['error', 'always'],
			'@stylistic/space-before-blocks': ['error', 'always'],
		},
	},
);
