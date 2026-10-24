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
| `main` | Modular — classic Nest modules: controller → service → repository | Small and medium services; the fork point for a new architecture |
| **`stable/hexagonal`** | **Pragmatic hexagonal** — `domain/`, `application/`, `infrastructure/` per module, outbound ports only | Rich domains whose rules should stay framework-free |
| `stable/layered` | Layered — `core/`, `common/`, `modules/`; flat modules with a repository class and Swagger schemas | Services with several cooperating modules and a documented API |

**This is `stable/hexagonal`.**

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
- **Testing**: Jest — unit tests for the domain, the application services
  and utils; e2e specs against a real database
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
    health/               no persistence: domain + application + infrastructure, no port
    order/
      order.module.ts             the composition root — binds the port to an adapter
      domain/
        order.entity.ts           Order, the aggregate root
        order.constant.ts         ORDER_STATUSES, limits
        order.interface.ts        IOrderItemPrimitives
        valueObjects/             OrderId, OrderItem
      application/
        order.service.ts          one service, every operation a method
        orderRepository.port.ts   IOrderRepository + ORDER_REPOSITORY
      infrastructure/
        order.controller.ts       HTTP in, DTO out
        order.swagger.ts          ORDER_SWAGGER, ORDER_PROPERTY_SWAGGER
        dto/                      request and response DTOs
        adapters/<engine>/        per engine: <engine>Order.adapter / .entity / .mapper
  tests/                  unit tests: the domain, the services, the utils
test/                     e2e specs, one per module with a controller
```

The top level is split **by kind**, exactly as on `main`. Inside a module,
code is split into three layers, and **every dependency points inward**:

```
              infrastructure                application              domain
HTTP ─► OrderController ──────────► OrderService ─────────► Order, OrderItem, OrderId
                                          │
                                          ▼
                                  IOrderRepository (port)
                                          ▲  implements
          PostgresOrderAdapter ───────────┴────────── MongoOrderAdapter
           + entity + mapper                           + entity + mapper
                 │                                            │
                 └───────────────► TypeORM ◄──────────────────┘
```

- **The domain** is the centre: the `Order` aggregate and its value objects,
  as plain classes with no framework. It enforces every invariant itself —
  an item needs a SKU, a positive whole quantity and a non-negative price;
  an order needs at least one item; only a pending order can be cancelled;
  the total is derived, never stored as truth.
- **The application layer** orchestrates: it builds or loads the aggregate,
  calls its methods, persists it through a **port**, and turns "not found"
  or "can't be cancelled" into Nest's HTTP exceptions.
- **The infrastructure layer** is everything that touches the outside
  world: the controller and its DTOs on the way in, and the **adapters** on
  the way out — one per database engine, each with its TypeORM entity and a
  mapper that converts rows to aggregates and back.

**Why "pragmatic"?** Only outbound ports exist. The controller calls the
application service directly — no inbound port, no use-case class per
operation — which removes ceremony without moving any business rule out of
the domain. Swapping the database is still a one-line change in the
composition root.

ESLint enforces the arrows: the domain can't import Nest, `class-validator`,
TypeORM or an outer layer; the application layer can't import
infrastructure; a controller can't import a port or an adapter.

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

// order.module.ts — the composition root
TypeOrmModule.forFeature([PostgresOrderEntity]),
// TypeOrmModule.forFeature([MongoOrderEntity]),
…
{ provide: ORDER_REPOSITORY, useClass: PostgresOrderAdapter },
// { provide: ORDER_REPOSITORY, useClass: MongoOrderAdapter },
```

To switch to MongoDB, flip the comments in `app.module.ts` **and** in every
module that stores data — they must all name the same engine.

| | Postgres | MongoDB |
| --- | --- | --- |
| Entity | `PostgresOrderEntity` — `uuid` primary key, `jsonb` items | `MongoOrderEntity` — `_id` plus a unique `id` holding the same UUID |
| Schema | SQL migrations (tables) | Migrations creating the collection's indexes |

Neither the domain nor the service changes — that is the point of the
port. `npm run check:standards` fails while any adapter, entity or mapper
lacks its sibling for the other engine. The details are in
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

- **Unit** (`npm test`): the business logic, which here is exactly the
  inner two layers — every aggregate, value object and application service
  — plus every util, in `src/tests/`. Domain tests need no mocks at all; a
  service is built by hand with its port mocked — no Nest container, no
  database.
- **e2e** (`npm run test:e2e`): every module with a controller, in
  `test/`, booting the real app against a real database. Run it on both
  engines by flipping the switch (above) and running it again.

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

Then delete the database engine you won't use (its config, adapters,
entities, mappers, migrations and commented switch lines), replace the `order` example
with your own modules, and pull rule or tooling updates from `core` as
they land.

## License and usage

Free to use, fork and build on. Credit as co-author on the resulting
implementation is appreciated, not required.
