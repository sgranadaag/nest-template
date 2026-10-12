---
description: Verify the project follows .claude/rules/ (folder structure, naming, responsibility layers, persistence, testing) plus clean-code and repo hygiene, for whichever architecture the current branch implements.
---

Review the current implementation against this project's own standards,
not generic style opinions. Read every file under `.claude/rules/` first —
they describe the architecture of **this branch** (`main` is modular,
`stable/hexagonal` is ports & adapters, `stable/layered` is
core/common/modules) and are the source of truth, not any assumption from
earlier in the conversation or from another branch.

The pre-commit hook already runs ESLint (relative-parent imports, the
architecture's restricted imports, unused bindings) and
`scripts/check-standards.mjs` (alias sync, unused dependencies, file
naming and placement, engine parity, test presence). Run both again —
`npm run lint` and `npm run check:standards` — and report what they say,
but spend the review on what that automation **can't** judge.

## 1. Rule conformance

For every file under `src/`:

- **Responsibility** — walk the "Must NOT do" column of
  `responsibility-layers.md` file by file: a business rule in a
  controller, a repository, a DTO or the module file; a repository that
  throws, validates or decides; a service that knows HTTP beyond Nest's
  built-in exceptions.
- **Direction of dependency** — imports that ESLint's patterns don't cover:
  one module reaching into another's internals instead of an exported
  provider, an entity escaping its repository, a shared folder knowing a
  module.
- **Persistence** — against `persistence.md`: switch points naming
  different engines, commented-out code anywhere else, a raw `process.env`
  read, a repository returning
  an entity, the two engine implementations disagreeing in behaviour (one
  sorting, one not; one returning `null`, one throwing).
- **Naming** — names that pass the mechanical check but say the wrong
  thing: a CRUD synonym (`getOne`, `deleteById`), a domain action hidden
  behind `update`, an enum compared as a bare string.
- **Comments** — any comment outside the exceptions in
  `naming-conventions.md`.

## 2. Clean code

- Dead code: unused exports, methods never called, orphaned files.
- Duplication that a shared util should own — check `utils/` first. A
  repository's private conversion methods duplicating its sibling engine's
  are expected, not a finding.
- Functions doing more than one job; misleading names; swallowed errors.

## 3. Testing

Against `testing.md`: tests that assert internals instead of behaviour,
missing exception paths, a service test spinning up Nest or a database, an
e2e spec depending on data it didn't create or not cleaning up.

## Reporting

Group findings by section, most impactful first. For each: file path, line
if applicable, which rule it breaks, and a one-line fix. Don't restate what
is already correct. If a rule itself looks stale relative to the code, say
so explicitly instead of forcing the code to match outdated docs.
