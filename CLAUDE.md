# nest-template

Reusable NestJS service **template**: architecture, tooling and one worked
example (`order`) — no business logic of its own. A service is created
from it (and keeps it as a `core` git remote), then extended with real
modules following
[.claude/rules/responsibility-layers.md](.claude/rules/responsibility-layers.md).

Everything in `.claude/rules/` is kept deliberately **abstract**: the rules
describe what each layer owns, never a particular feature, so they travel
unchanged into every project created from here. If a new flow doesn't fit
them, the flow is wrong before the rule is. [README.md](./README.md) is the
narrative version for a person arriving at the repo; where the two
disagree, the rules win and the README is what needs fixing.

Read them before making structural changes:

- [.claude/rules/responsibility-layers.md](.claude/rules/responsibility-layers.md) — **start here**: domain / application / infrastructure, and why every dependency points inward
- [.claude/rules/folder-structure.md](.claude/rules/folder-structure.md)
- [.claude/rules/naming-conventions.md](.claude/rules/naming-conventions.md)
- [.claude/rules/persistence.md](.claude/rules/persistence.md) — Postgres and MongoDB, one active at a time
- [.claude/rules/testing.md](.claude/rules/testing.md)

## Architecture branches

The template keeps parallel branches that implement the same example with
a different architecture, the same way `next-core` keeps one branch per
state manager:

| Branch | Architecture | Reference |
| --- | --- | --- |
| `main` | Modular — classic Nest modules (controller → service → repository), shared folders split by kind | the fork point |
| **`stable/hexagonal`** (this branch) | **Pragmatic hexagonal** — `domain/` / `application/` / `infrastructure/` per module, outbound ports only | `nest-hexagonal` `stable/main` |
| `stable/layered` | Layered — `core/` / `common/` / `modules/`, flat modules, Swagger schemas | `oauth/auth-server` |

What every branch shares on purpose: the tooling (Nest 12, rspack, Jest,
ESLint + Prettier, Husky), the two database engines and how one is chosen,
the `order` and `health` examples and their HTTP surface, and the e2e
specs. What differs is `src/modules/`, the rules, `eslint.config.mjs`'s
architecture blocks and `scripts/check-standards.mjs`'s configuration
block (plus the folder check, which here looks inside the layers). A
change to the shared part is made on every branch.

## This branch in one paragraph

Each module is an aggregate with three layers. `domain/` holds the
aggregate root and its value objects — plain classes, no framework, every
invariant. `application/` holds one service per aggregate and the
**outbound ports** (interface + `Symbol` token) it needs; it throws Nest's
HTTP exceptions. `infrastructure/` holds the controller, DTOs, Swagger
schema, and `adapters/<engine>/` — one adapter + TypeORM entity + mapper
per engine. The module file is the composition root that binds each port to
an adapter. There are no inbound ports: the controller calls the service
class directly. That is the "pragmatic" part, and it is deliberate.

## Project declarations

| Declaration | Value |
| --- | --- |
| Language of code, docs and API messages | English |
| Database engine switched on | `postgres` (`app.module.ts` + each persistence module) |

## Common commands

| Command | Purpose |
| --- | --- |
| `nvm use` | Node version pinned in `.nvmrc` (Nest 12 needs Node ≥ 24 for `require(esm)`) |
| `npm i` | Install dependencies (also installs the Husky hooks) |
| `docker compose up -d` | Start Postgres and MongoDB |
| `npm run migration:postgres:run` / `migration:mongo:run` | Apply each engine's migrations (`:revert` undoes the last) |
| `npm run start:dev` | Start the API in watch mode (http://localhost:3000) |
| `npm run build` / `npm run start:prod` | Production bundle (`dist/main.js`) / run it |
| `npm run lint` | ESLint, including the architecture's import rules |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:standards` | Alias sync, unused deps, naming, placement, folders, engine parity, test presence, interface names |
| `npm test` | Unit suite |
| `npm run test:e2e` | e2e suite against the engine switched on |

Matching slash commands live under `.claude/commands/`: `/dev`, `/build`,
`/lint`, `/typecheck`, `/test`, `/standards-review`.

## Verifying a change

On **every change**:

```
npm run typecheck && npm run lint && npm run check:standards && npm test && npm run build
```

plus `npm run test:e2e` on **both** engines (flip the switch points, see
`persistence.md`) when anything persistence- or HTTP-facing changed. Report
what actually ran: a failed step with its output, a skipped step as
skipped.

## Pre-commit / pre-push hooks

Husky enforces the mechanically-checkable subset of the rules — it
doesn't replace `/standards-review`'s judgement:

- **`.husky/pre-commit`**: `lint-staged` (ESLint `--fix`, Prettier
  included, on staged `*.ts`) → `npm run typecheck` →
  `npm run check:standards`. Any failure aborts the commit.
- **`.husky/pre-push`**: `npm test`.
- ESLint (`eslint.config.mjs`) enforces as errors: no relative-parent
  imports; `domain/` importing Nest, `class-validator`, TypeORM, a driver,
  `application/` or `infrastructure/`; `application/` importing
  `infrastructure/` or TypeORM; a controller importing a port, an adapter
  or TypeORM; a shared folder importing a module; `any`, floating
  promises, `console`.
- `scripts/check-standards.mjs` checks what ESLint can't: aliases in sync
  across `tsconfig.json` and both Jest configs, every dependency used,
  every file named `<camelCase>.<role>.ts` and placed in its role's
  layer and folder, no kind folder (`valueObjects/`, `ports/`, `dto/`,
  `interfaces/`) wrapping a single file and no two files of a kind left
  outside one, every adapter/entity/mapper paired with a sibling per
  engine, every aggregate, value object, service and util with its unit
  test, every controller with its e2e spec, and every interface named
  `I<Name>`.
- Not automated: whether a rule lives in the right layer, whether the two
  engines behave the same, whether a test asserts behaviour.

## The worked example

`order` is the reference a new module is built against, not a feature:

| Endpoint | What it demonstrates |
| --- | --- |
| `POST /orders` | DTO → primitives in the controller; `Order.create` with validated `OrderItem` value objects; the total derived by the aggregate |
| `GET /orders`, `GET /orders/:id` | Reads through the `IOrderRepository` port; mappers rebuilding the aggregate with `reconstitute`; 404 decided by the service |
| `PATCH /orders/:id/cancel` | An aggregate method guarding its invariant (`canBeCancelled` / `cancel`), the service answering 409, the port's `save` as an upsert |
| `DELETE /orders/:id` | 204 on success, 404 when absent |
| `GET /health` | A module with no persistence: domain + application + infrastructure, no port |

Removing it means deleting `src/modules/order/`, `src/tests/order/`,
`test/order.e2e-spec.ts`, the `orders` migrations of both engines and
`OrderModule` in `app.module.ts`, and `roundMoney` from `numeric.util.ts`
if nothing else uses it.

## Good practices

- Keep the template free of business logic: what belongs here is what
  every service would otherwise rebuild — a layer, a shared helper, a rule.
- TypeScript is strict about `any` and unused code; use `unknown` and
  narrowing at I/O boundaries.
- Every environment variable is named once in `ENV` and listed in
  `.env.example`. No secrets committed — `.env` is gitignored.
