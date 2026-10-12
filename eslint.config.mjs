// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const RELATIVE_PARENT_IMPORT = {
  group: ['../*'],
  message:
    'Use a @alias import instead of a relative parent import — see .claude/rules/folder-structure.md.',
};

const PERSISTENCE_IMPORTS = [
  {
    group: ['typeorm', '@nestjs/typeorm', 'pg', 'mongodb'],
    message:
      'Only a module’s repositories/ and entities/ (and config/, migrations/) talk to the database driver — see .claude/rules/responsibility-layers.md.',
  },
  {
    group: ['**/repositories/*', '**/entities/*'],
    message:
      'Depend on the module’s I<Module>Repository interface (injected by its token), never on a concrete engine implementation — see .claude/rules/persistence.md.',
  },
];

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'error',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    // .claude/rules/folder-structure.md: every cross-folder import goes
    // through a @alias. The TypeORM CLI datasources are the one exception —
    // it runs outside webpack and the alias resolver.
    files: ['src/**/*.ts'],
    ignores: ['src/config/*.datasource.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [RELATIVE_PARENT_IMPORT] }],
    },
  },
  {
    // .claude/rules/responsibility-layers.md: shared folders never reach
    // into a feature module.
    files: [
      'src/config/**/*.ts',
      'src/constants/**/*.ts',
      'src/middlewares/**/*.ts',
      'src/decorators/**/*.ts',
      'src/interfaces/**/*.ts',
      'src/utils/**/*.ts',
    ],
    ignores: ['src/config/*.datasource.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            RELATIVE_PARENT_IMPORT,
            {
              group: ['@modules/*'],
              message:
                'Shared folders never import a feature module — see .claude/rules/responsibility-layers.md.',
            },
          ],
        },
      ],
    },
  },
  {
    // .claude/rules/responsibility-layers.md: controllers and services
    // never touch the database driver or a concrete repository.
    files: ['src/modules/**/*.controller.ts', 'src/modules/**/*.service.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [RELATIVE_PARENT_IMPORT, ...PERSISTENCE_IMPORTS] },
      ],
    },
  },
  {
    // .claude/rules/responsibility-layers.md: a controller speaks to its
    // service only, never to a repository, abstract or not.
    files: ['src/modules/**/*.controller.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            RELATIVE_PARENT_IMPORT,
            ...PERSISTENCE_IMPORTS,
            {
              group: ['**/repositories/*', '**/*.repository'],
              message:
                'A controller calls its service, never a repository — see .claude/rules/responsibility-layers.md.',
            },
          ],
        },
      ],
    },
  },
);
