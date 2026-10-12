# nest-template

A reusable template for NestJS services. It holds what every service built
from it shares — the folder layout, the tooling, the persistence setup, the
rules that keep a codebase consistent — plus one worked example (`order`)
that exercises all of it end to end. No business logic lives here: a real
service is created from this repository, keeps it as its `core` git remote,
and adds its own modules on top.

## Branches

The same example is kept on parallel branches, one per architecture. The
tooling, the HTTP surface, the database engines and the e2e specs are the
same on all of them; what changes is how `src/` is organised and the rules
that hold it in place.

| Branch | Architecture | When to pick it |
| --- | --- | --- |
| **`main`** | **Modular** — classic Nest modules: controller → service → repository | Small and medium services; the fork point for a new architecture |
| `stable/hexagonal` | Pragmatic hexagonal — `domain/`, `application/`, `infrastructure/` per module, outbound ports only | Rich domains whose rules should stay framework-free |
| `stable/layered` | Layered — `core/`, `common/`, `modules/`; flat modules with a repository class and Swagger schemas | Services with several cooperating modules and a documented API |

**This is `main`.**

## Stack

> Runs on **Node 24** (pinned in `.nvmrc` — `nvm use`). Nest 12 ships as
> ES modules, and Node 24 loads them from the CommonJS bundle natively.

- **NestJS 12** + TypeScript, bundled by the Nest CLI's **rspack** builder
- **Persistence**: **Postgres and MongoDB through TypeORM**, one active at
  a time — switched in code, the other engine commented out beside it
- **Validation**: `class-validator` DTOs behind a global `ValidationPipe`
- **API docs**: Swagger at `/docs`, one `@SwaggerDocs` decorator per
  endpoint fed by each module's `<module>.swagger.ts`
- **Errors**: one global filter turns every failure into the same JSON body
- **Testing**: Jest — unit tests for services and utils, e2e specs against
  a real database
- **Quality gates**: ESLint (with the architecture's import rules) +
  Prettier, a standards script, Husky pre-commit / pre-push hooks
- **Local infrastructure**: `docker-compose.yml` with Postgres 16 and
  MongoDB 7; a multi-stage `Dockerfile` for the service

## Getting started

```bash
nvm use                      # Node 24
npm i                        # also installs the git hooks
cp .env.example .env         # connection settings for both engines
docker compose up -d         # Postgres + MongoDB
npm run migration:postgres:run   # tables
npm run migration:mongo:run      # collection indexes
npm run start:dev            # http://localhost:3000/docs
```

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | API in watch mode |
| `npm run build` / `npm run start:prod` | Production bundle in `dist/` / run it |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:standards` | Naming, placement, folders, aliases, dependencies, engine parity, test presence, interface names |
| `npm test` | Unit suite |
| `npm run test:e2e` | e2e suite against the engine switched on |
| `npm run migration:postgres:run` / `migration:postgres:revert` | Postgres migrations |
| `npm run migration:mongo:run` / `migration:mongo:revert` | MongoDB migrations |
| `npm run migration:create -- src/migrations/<engine>/<Name>` | Scaffold a migration |

## Folder structure and architecture

```
src/
  main.ts                 bootstrap: validation pipe, error filter, Swagger, listen
  app.module.ts           config, database connection (engine switch), the module list
  config/                 options per engine, Swagger, the migration CLI's data sources
  constants/              ENV keys
  decorators/             SwaggerDocs — one decorator per endpoint
  interfaces/             interfaces shared by several layers
  middlewares/            request logger, global exception filter
  utils/                  pure helpers, one file per kind: crypto, http, numeric…
  migrations/
    postgres/             SQL: tables
    mongo/                collection indexes
  modules/
    health/               a module without persistence
      health.module.ts / .controller.ts / .service.ts / .swagger.ts
      healthResponse.dto.ts     a single DTO sits at the module root…
    order/
      order.module.ts           wiring — the engine switch for entity + repository
      order.controller.ts       HTTP in, DTO out
      order.service.ts          business rules
      order.interface.ts        IOrder, IOrderItem, IOrderRepository
      order.constant.ts         ORDER_STATUSES, limits, ORDER_REPOSITORY token
      order.swagger.ts          ORDER_SWAGGER, ORDER_PROPERTY_SWAGGER
      dto/                      …and moves into a folder from the second one
      entities/                 postgresOrder.entity.ts, mongoOrder.entity.ts
      repositories/             postgresOrder.repository.ts, mongoOrder.repository.ts
  tests/                  unit tests, mirroring modules/ and utils/
test/                     e2e specs, one per module with a controller
```

The top level is split **by kind**: shared, module-agnostic code in its own
folder, and everything that knows what the service does inside
`modules/`. Inside a module the layout is the classic Nest one, with a
single addition — a repository interface injected by token — because the
service must not know which database it is running on. A folder only ever
wraps two or more files.

```
HTTP ─► controller ─► service ─► IOrderRepository (ORDER_REPOSITORY)
                                       ▲
             PostgresOrderRepository ──┴── MongoOrderRepository
                                       │
                                  TypeORM ─► database
```

- **The controller** owns the HTTP side only: routes, params, status codes,
  and mapping the service's result into a response DTO.
- **The service** owns every business rule: building a new order, computing
  its total, deciding that only a pending order can be cancelled, deciding
  that a missing order is a 404.
- **The repository** owns storage and nothing else. It returns `null` for
  "not found" and never throws for it — what that means is the service's
  call.

ESLint enforces the direction: a controller cannot import a repository,
neither a controller nor a service can import TypeORM or a driver, and
shared folders cannot import a module.

## Several database engines

Both engines are fully written; one is switched on **in code**, with the
other commented out right beside it. Postgres is on by default:

```ts
// app.module.ts — the connection
import { postgresConfig } from '@config/postgres.config';
// import { mongoConfig } from '@config/mongo.config';
…
useFactory: postgresConfig,
// useFactory: mongoConfig,

// order.module.ts — the entity and the repository
TypeOrmModule.forFeature([PostgresOrderEntity]),
// TypeOrmModule.forFeature([MongoOrderEntity]),
…
{ provide: ORDER_REPOSITORY, useClass: PostgresOrderRepository },
// { provide: ORDER_REPOSITORY, useClass: MongoOrderRepository },
```

To switch to MongoDB, flip the comments in `app.module.ts` **and** in every
module that stores data — they must all name the same engine.

| | Postgres | MongoDB |
| --- | --- | --- |
| Entity | `PostgresOrderEntity` — `uuid` primary key, `jsonb` items | `MongoOrderEntity` — `_id` plus a unique `id` holding the same UUID |
| Schema | SQL migrations (tables) | Migrations creating the collection's indexes |

`npm run check:standards` fails while any entity or repository lacks its
sibling for the other engine. The details are in
[.claude/rules/persistence.md](.claude/rules/persistence.md).

## The worked example

| Endpoint | Behaviour |
| --- | --- |
| `POST /orders` | `{ customerEmail, items: [{ sku, quantity, unitPrice }] }` → a `pending` order with its `total` |
| `GET /orders` | Every order, newest first |
| `GET /orders/:id` | One order, 404 if absent |
| `PATCH /orders/:id/cancel` | `pending` → `cancelled`; 409 for any other status |
| `DELETE /orders/:id` | 204, or 404 if absent |
| `GET /health` | Status and uptime |

## Testing

- **Unit** (`npm test`): every service and every util, in
  `src/tests/`. A service is built by hand with a mocked repository — no
  Nest container, no database.
- **e2e** (`npm run test:e2e`): every module with a controller, in
  `test/`, booting the real app against a real database. Run it on both
  engines by flipping the switch (below) and running it again.

## Rules for contributors (and for Claude)

The normative version of everything above lives in `.claude/rules/`:
[responsibility layers](.claude/rules/responsibility-layers.md),
[folder structure](.claude/rules/folder-structure.md),
[naming conventions](.claude/rules/naming-conventions.md),
[persistence](.claude/rules/persistence.md) and
[testing](.claude/rules/testing.md). Husky blocks a commit that breaks the
mechanical subset — lint, types, `check:standards` — and a push that breaks
the unit suite. `/standards-review` covers the judgement calls.

## Creating a service from the template

```bash
git clone git@github.com:sgranadaag/nest-template.git my-service
cd my-service
git checkout <branch>                      # main, stable/hexagonal or stable/layered
git remote rename origin core
git remote add origin <your-repository>
```

Then delete the database engine you won't use (its config, entities,
repositories and commented switch lines), replace the `order` example
with your own modules, and pull rule or tooling updates from `core` as
they land.

## License and usage

Free to use, fork and build on. Credit as co-author on the resulting
implementation is appreciated, not required.
