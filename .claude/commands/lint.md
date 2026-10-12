---
description: Run ESLint
---

Run `npm run lint` and report any errors or warnings. Errors from `no-restricted-imports` are architecture violations (see `.claude/rules/responsibility-layers.md`), not style — report them as such. If there are auto-fixable issues, ask before running `npm run lint -- --fix`.
