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

const DRIVER_IMPORTS = {
  group: ['typeorm', '@nestjs/typeorm', 'pg', 'mongodb'],
  message:
    'Only infrastructure/adapters/ (and config/, migrations/, the module file) talk to the database driver — see .claude/rules/responsibility-layers.md.',
};

const FRAMEWORK_IMPORTS = {
  group: ['@nestjs/*', 'class-validator', 'class-transformer'],
  message:
    'domain/ is framework-free: plain classes, no Nest, no validation decorators — see .claude/rules/responsibility-layers.md.',
};

const OUTER_LAYERS_FROM_DOMAIN = {
  group: ['@modules/*/application/**', '@modules/*/infrastructure/**', '**/application/*', '**/infrastructure/*'],
  message:
    'Dependencies point inward: domain/ never imports application/ or infrastructure/ — see .claude/rules/responsibility-layers.md.',
};

const INFRASTRUCTURE_FROM_APPLICATION = {
  group: ['@modules/*/infrastructure/**', '**/infrastructure/*'],
  message:
    'Dependencies point inward: application/ depends on its ports, never on infrastructure/ — see .claude/rules/responsibility-layers.md.',
};

const ADAPTERS_FROM_CONTROLLER = {
  group: ['**/adapters/*', '**/*.port'],
  message:
    'A controller calls its application service, never a port or an adapter — see .claude/rules/responsibility-layers.md.',
};

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
    // .claude/rules/responsibility-layers.md: the domain is the centre —
    // no framework, no driver, no outer layer.
    files: ['src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            RELATIVE_PARENT_IMPORT,
            DRIVER_IMPORTS,
            FRAMEWORK_IMPORTS,
            OUTER_LAYERS_FROM_DOMAIN,
          ],
        },
      ],
    },
  },
  {
    // .claude/rules/responsibility-layers.md: application/ talks to the
    // outside world through its ports only.
    files: ['src/modules/*/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            RELATIVE_PARENT_IMPORT,
            DRIVER_IMPORTS,
            INFRASTRUCTURE_FROM_APPLICATION,
          ],
        },
      ],
    },
  },
  {
    // .claude/rules/responsibility-layers.md: a controller is the inbound
    // edge — it calls its service, never a port, an adapter or the driver.
    files: ['src/modules/*/infrastructure/*.controller.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            RELATIVE_PARENT_IMPORT,
            DRIVER_IMPORTS,
            ADAPTERS_FROM_CONTROLLER,
          ],
        },
      ],
    },
  },
);
