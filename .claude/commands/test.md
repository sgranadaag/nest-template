---
description: Run the unit suite, and the e2e suite on every database engine
---

1. Run `npm test` (unit) and report the result.
2. If the user asked for e2e, or the change touched a controller, a DTO, a repository or an entity: make sure both databases are up (`docker compose up -d`), run `npm run migration:postgres:run` and `npm run migration:mongo:run`, then `npm run test:e2e` on the engine currently switched on; flip every switch point to the other engine (`.claude/rules/persistence.md`), run it again, and flip back. Report each engine's result separately — an e2e suite that passes on one engine only is a failure.
