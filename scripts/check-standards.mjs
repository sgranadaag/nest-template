#!/usr/bin/env node
// Mechanical checks from .claude/rules/ that ESLint can't express. Run via
// `npm run check:standards` (also wired into the pre-commit hook):
//   1. path aliases agree across tsconfig.json and both Jest configs
//   2. every declared dependency is actually used
//   3. every file under src/ is named <camelCase>.<role>.ts with a known role
//   4. every role lives in the folder the rules assign it
//   5. a module folder wraps 2+ files, and 2+ files of one kind get a folder
//   6. every engine-specific persistence file has a sibling per engine
//   7. every service and util has its unit test, every controller its e2e spec
//   8. every interface is named I<Name>

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Branch configuration — the only block that differs between branches.
// ---------------------------------------------------------------------------
const ARCHITECTURE = 'modular (main)';

const ROOT_FILES = ['src/main.ts', 'src/app.module.ts'];

const MIGRATION_FOLDER = 'src/migrations/';
const MIGRATION_NAME = /^\d{13}-[A-Z][A-Za-z0-9]*\.ts$/;

const MODULE = '[a-z][a-zA-Z0-9]*';

const MODULE_ROOT = `^src/modules/${MODULE}$`;

// role -> the folder(s) a file with that role may live in (regex on the
// path relative to the repo root, file name excluded).
const ROLE_PLACEMENT = {
  module: [MODULE_ROOT],
  controller: [MODULE_ROOT],
  service: [MODULE_ROOT],
  constant: ['^src/constants$', MODULE_ROOT],
  swagger: [MODULE_ROOT],
  dto: [MODULE_ROOT, `^src/modules/${MODULE}/dto$`],
  interface: ['^src/interfaces$', MODULE_ROOT, `^src/modules/${MODULE}/interfaces$`],
  entity: [MODULE_ROOT, `^src/modules/${MODULE}/entities$`],
  repository: [MODULE_ROOT, `^src/modules/${MODULE}/repositories$`],
  config: ['^src/config$'],
  datasource: ['^src/config$'],
  decorator: ['^src/decorators$'],
  middleware: ['^src/middlewares$'],
  filter: ['^src/middlewares$'],
  util: ['^src/utils$'],
  test: ['^src/tests/.+$'],
};

// Inside a module, a file of these roles sits at the module root while it is
// the only one of its kind, and moves into this folder from the second on.
const GROUPED_ROLE_FOLDERS = {
  dto: 'dto',
  interface: 'interfaces',
  entity: 'entities',
  repository: 'repositories',
};

const INTERFACE_NAME = /^I[A-Z][A-Za-z0-9]*$/;

// Database engines the template supports, and the folders whose files must
// carry an engine prefix and exist once per engine.
const DATABASE_ENGINES = ['postgres', 'mongo'];
const ENGINE_FOLDERS = [/\/entities$/, /\/repositories$/];

// Which sources need a unit test, and where that test lives.
const UNIT_TESTED = [
  {
    source: new RegExp(`^src/modules/(${MODULE})/(${MODULE}\\.service)\\.ts$`),
    test: (match) => `src/tests/${match[1]}/${match[2]}.test.ts`,
  },
  {
    source: /^src\/utils\/([a-z][a-zA-Z0-9]*\.util)\.ts$/,
    test: (match) => `src/tests/utils/${match[1]}.test.ts`,
  },
];

const CONTROLLER = new RegExp(`^src/modules/(${MODULE})/${MODULE}\\.controller\\.ts$`);

// ---------------------------------------------------------------------------

const root = process.cwd();
let failed = false;

const fail = (message) => {
  console.error(`✖ ${message}`);
  failed = true;
};

const readFile = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const toPosix = (filePath) => filePath.split(path.sep).join('/');

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, out);
    } else {
      out.push(toPosix(path.relative(root, full)));
    }
  }
  return out;
}

const sourceFiles = walkFiles(path.join(root, 'src'));

// ---------------------------------------------------------------------------
// 1. tsconfig.json paths <-> package.json jest <-> test/jest-e2e.json.
// ---------------------------------------------------------------------------
function aliasesOf(moduleNameMapper) {
  return new Set(
    Object.keys(moduleNameMapper ?? {}).map((key) =>
      key.replace(/^\^/, '').replace(/\/\(\.\*\)\$$/, ''),
    ),
  );
}

function checkAliasSync() {
  const tsconfig = JSON.parse(readFile('tsconfig.json'));
  const tsPaths = tsconfig.compilerOptions?.paths ?? {};
  const tsAliases = new Set(Object.keys(tsPaths).map((key) => key.replace(/\/\*$/, '')));

  const jestConfigs = {
    'package.json (jest)': JSON.parse(readFile('package.json')).jest?.moduleNameMapper,
    'test/jest-e2e.json': JSON.parse(readFile('test/jest-e2e.json')).moduleNameMapper,
  };

  for (const [name, mapper] of Object.entries(jestConfigs)) {
    const jestAliases = aliasesOf(mapper);
    for (const alias of tsAliases) {
      if (!jestAliases.has(alias)) {
        fail(`tsconfig.json declares "${alias}", but ${name}'s moduleNameMapper has no matching entry.`);
      }
    }
    for (const alias of jestAliases) {
      if (!tsAliases.has(alias)) {
        fail(`${name}'s moduleNameMapper declares "${alias}", but tsconfig.json's paths has no matching entry.`);
      }
    }
  }

  for (const [alias, targets] of Object.entries(tsPaths)) {
    const target = targets[0]?.replace(/\/\*$/, '').replace(/^\.\//, '');
    if (target && !fs.existsSync(path.join(root, target))) {
      fail(`tsconfig.json's "${alias}" points at "${target}", which doesn't exist — a leftover from a deleted folder?`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Every declared dependency has at least one real usage.
// ---------------------------------------------------------------------------
const ALLOWLISTED_UNUSED = new Set([
  // Build, lint, format and test tooling — run, never imported.
  '@nestjs/cli',
  '@nestjs/schematics',
  '@rspack/core',
  'webpack-node-externals',
  'tsconfig-paths-webpack-plugin',
  'tsconfig-paths',
  'typescript',
  'ts-node',
  'ts-jest',
  'jest',
  'eslint',
  'eslint-config-prettier',
  'prettier',
  'husky',
  'lint-staged',
  'source-map-support',
  // Database drivers TypeORM loads by name at runtime.
  'pg',
  // Runtime peers of Nest: loaded by the framework, never imported here.
  'reflect-metadata',
  'rxjs',
  '@nestjs/platform-express',
  // Ambient types only.
  '@types/node',
  '@types/jest',
  '@types/express',
  '@types/supertest',
]);

function checkUnusedDependencies() {
  const pkg = JSON.parse(readFile('package.json'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const usageFiles = [
    ...sourceFiles.filter((file) => file.endsWith('.ts')),
    ...walkFiles(path.join(root, 'test')).filter((file) => file.endsWith('.ts')),
    'eslint.config.mjs',
  ];
  const combined = usageFiles.map((file) => readFile(file)).join('\n');

  for (const name of Object.keys(deps)) {
    if (ALLOWLISTED_UNUSED.has(name)) continue;

    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const usagePattern = new RegExp(`["'\`]${escaped}(/[^"'\`]*)?["'\`]`);

    if (!usagePattern.test(combined)) {
      fail(`"${name}" is declared in package.json but nothing in src/, test/ or eslint.config.mjs imports it — dead dependency?`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3 + 4. <camelCase>.<role>.ts, and the role lives in its folder.
// ---------------------------------------------------------------------------
const FILE_NAME = /^([a-z][a-zA-Z0-9]*)\.([a-z][a-zA-Z0-9]*)(\.test)?\.ts$/;

function checkNamingAndPlacement() {
  for (const file of sourceFiles) {
    if (ROOT_FILES.includes(file)) continue;

    const folder = path.posix.dirname(file);
    const fileName = path.posix.basename(file);

    if (file.startsWith(MIGRATION_FOLDER)) {
      if (!MIGRATION_NAME.test(fileName)) {
        fail(`${file}: migrations are named <13-digit timestamp>-<PascalCaseName>.ts — see .claude/rules/naming-conventions.md.`);
      }
      continue;
    }

    const match = fileName.match(FILE_NAME);
    if (!match) {
      fail(`${file}: not <camelCase>.<role>.ts — see .claude/rules/naming-conventions.md.`);
      continue;
    }

    const role = match[3] ? 'test' : match[2];
    const placement = ROLE_PLACEMENT[role];
    if (!placement) {
      fail(`${file}: unknown role ".${role}" — add it to .claude/rules/naming-conventions.md (and this script) or rename the file.`);
      continue;
    }

    if (!placement.some((pattern) => new RegExp(pattern).test(folder))) {
      fail(`${file}: a .${role}.ts file doesn't belong in ${folder}/ — see .claude/rules/folder-structure.md.`);
    }

    if (role === 'module') {
      const moduleFolder = path.posix.basename(folder);
      if (match[1] !== moduleFolder) {
        fail(`${file}: a module file is named for its folder (${moduleFolder}.module.ts).`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Engine parity for persistence files.
// ---------------------------------------------------------------------------
function checkEngineParity() {
  const engines = DATABASE_ENGINES;

  const engineFiles = sourceFiles.filter((file) =>
    ENGINE_FOLDERS.some((pattern) => pattern.test(path.posix.dirname(file))),
  );

  for (const file of engineFiles) {
    const folder = path.posix.dirname(file);
    const fileName = path.posix.basename(file);
    const engine = engines.find((candidate) => fileName.startsWith(candidate) && /^[A-Z]/.test(fileName.slice(candidate.length)));

    if (!engine) {
      fail(`${file}: persistence files are prefixed with their engine (${engines.join(' | ')}) — see .claude/rules/persistence.md.`);
      continue;
    }

    const rest = fileName.slice(engine.length);
    for (const sibling of engines) {
      const siblingFile = `${folder}/${sibling}${rest}`;
      if (!fs.existsSync(path.join(root, siblingFile))) {
        fail(`${file} has no ${sibling} counterpart (${siblingFile}) — every engine implements every persistence file, see .claude/rules/persistence.md.`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Tests exist for what the testing rules say gets one.
// ---------------------------------------------------------------------------
function checkTestPresence() {
  for (const file of sourceFiles) {
    for (const { source, test } of UNIT_TESTED) {
      const match = file.match(source);
      if (match && !fs.existsSync(path.join(root, test(match)))) {
        fail(`${file} has no unit test at ${test(match)} — see .claude/rules/testing.md.`);
      }
    }

    const controller = file.match(CONTROLLER);
    if (controller) {
      const spec = `test/${controller[1]}.e2e-spec.ts`;
      if (!fs.existsSync(path.join(root, spec))) {
        fail(`${file} has no e2e spec at ${spec} — see .claude/rules/testing.md.`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 7. A folder inside a module wraps 2+ files; 2+ files of a kind get one.
// ---------------------------------------------------------------------------
function roleOf(file) {
  return path.posix.basename(file).match(FILE_NAME)?.[2];
}

function checkModuleFolders() {
  const moduleRoot = new RegExp(MODULE_ROOT);
  const filesByFolder = new Map();
  for (const file of sourceFiles) {
    const folder = path.posix.dirname(file);
    filesByFolder.set(folder, [...(filesByFolder.get(folder) ?? []), file]);
  }

  for (const [folder, files] of filesByFolder) {
    const parent = path.posix.dirname(folder);

    if (moduleRoot.test(parent) && files.length === 1) {
      fail(`${folder}/ holds a single file — a folder only wraps 2+ files, move ${path.posix.basename(files[0])} to ${parent}/ (see .claude/rules/folder-structure.md).`);
    }

    if (moduleRoot.test(folder)) {
      for (const [role, groupFolder] of Object.entries(GROUPED_ROLE_FOLDERS)) {
        const ofRole = files.filter((file) => roleOf(file) === role);
        const grouped = filesByFolder.get(`${folder}/${groupFolder}`) ?? [];
        if (ofRole.length > 0 && ofRole.length + grouped.length > 1) {
          fail(`${folder}/ has ${ofRole.length + grouped.length} .${role}.ts files — from the second one on they all live in ${folder}/${groupFolder}/ (see .claude/rules/folder-structure.md).`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 8. Interfaces are named I<Name>.
// ---------------------------------------------------------------------------
function checkInterfaceNames() {
  for (const file of sourceFiles.filter((name) => name.endsWith('.ts'))) {
    for (const match of readFile(file).matchAll(/\binterface\s+([A-Za-z0-9_]+)/g)) {
      if (!INTERFACE_NAME.test(match[1])) {
        fail(`${file}: interface "${match[1]}" is not named I<Name> — see .claude/rules/naming-conventions.md.`);
      }
    }
  }
}

checkAliasSync();
checkUnusedDependencies();
checkNamingAndPlacement();
checkModuleFolders();
checkEngineParity();
checkTestPresence();
checkInterfaceNames();

if (failed) {
  console.error(`\nstandards check failed (${ARCHITECTURE}) — see .claude/rules/ and .claude/commands/standards-review.md.`);
  process.exit(1);
} else {
  console.log(`✓ standards check passed (${ARCHITECTURE}): aliases, dependencies, naming, placement, folders, engine parity, test presence, interface names.`);
}
