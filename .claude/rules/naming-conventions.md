# Naming conventions — hexagonal (`stable/hexagonal`)

## Files

`<name>.<role>.ts`, both parts `camelCase`. The role says what the file is
and decides which layer and folder it lives in — see [[folder-structure]].
`npm run check:standards` rejects an unknown role or a role in the wrong
place.

| Role | Where | Example |
| --- | --- | --- |
| `module` | `modules/<module>/` — named for its folder | `order.module.ts` |
| `entity` | `domain/` (the aggregate root), or `infrastructure/adapters/<engine>/` engine-prefixed (the TypeORM row) | `order.entity.ts`, `postgresOrder.entity.ts` |
| `valueObject` | `domain/`, or `domain/valueObjects/` from the second | `orderId.valueObject.ts` |
| `constant` | `domain/`, or `constants/` when app-wide | `order.constant.ts`, `environment.constant.ts` |
| `interface` | `domain/`, or `interfaces/` when shared | `order.interface.ts`, `swaggerDocs.interface.ts` |
| `service` | `application/` | `order.service.ts` |
| `port` | `application/`, or `application/ports/` from the second | `orderRepository.port.ts` |
| `controller` | `infrastructure/` | `order.controller.ts` |
| `swagger` | `infrastructure/` | `order.swagger.ts` |
| `dto` | `infrastructure/`, or `infrastructure/dto/` from the second | `dto/createOrder.dto.ts` |
| `adapter` | `infrastructure/adapters/<engine>/` — engine-prefixed | `mongoOrder.adapter.ts` |
| `mapper` | `infrastructure/adapters/<engine>/` — engine-prefixed | `mongoOrder.mapper.ts` |
| `config` / `datasource` | `config/` | `postgres.config.ts`, `mongo.datasource.ts` |
| `decorator` | `decorators/` | `swaggerDocs.decorator.ts` |
| `middleware` / `filter` | `middlewares/` | `httpException.filter.ts` |
| `util` | `utils/` — named for its kind | `http.util.ts` |
| `test` | `tests/<module>/` — `<source file name>.test.ts` | `order.entity.test.ts` |
| `e2e-spec` | `test/` — one per module with a controller | `order.e2e-spec.ts` |

Two exceptions: `src/main.ts` / `src/app.module.ts`, and
`migrations/<engine>/<13-digit timestamp>-<PascalCaseName>.ts`.

**Everything in `infrastructure/adapters/<engine>/` carries that engine
as a prefix** — `postgresOrder.adapter.ts` / class `PostgresOrderAdapter`, with
its `PostgresOrderEntity` and `PostgresOrderMapper`. The standards check
pairs every file with its sibling in each other engine's folder.

## Identifiers

- **Aggregates and value objects**: the plain domain noun, no suffix —
  `Order`, `OrderItem`, `OrderId`. They are what the business calls them.
- **Everything else is suffixed with its role**: `OrderService`,
  `OrderController`, `CreateOrderDto`, `PostgresOrderAdapter`,
  `MongoOrderEntity`, `MongoOrderMapper`.
- **Interfaces**: `I` + `PascalCase` name, nothing else — `IOrderRepository`
  (a port), `IOrderItemPrimitives`, `ISwaggerEndpoint`. `npm run
  check:standards` enforces it.
- **Port tokens**: `SCREAMING_SNAKE_CASE` `Symbol`s exported from the port
  file beside the interface — `ORDER_REPOSITORY`.
- **Enums**: `SCREAMING_SNAKE_CASE`, plural, string-valued —
  `ORDER_STATUSES`. Code compares against members, never the bare string.
- **Constants**: `SCREAMING_SNAKE_CASE` — `ENV`, `ORDER_ITEM_MAX_QUANTITY`.
- **Swagger schemas**: `<MODULE>_SWAGGER` and `<MODULE>_PROPERTY_SWAGGER`.
- **Environment variables** are read through `ENV.<KEY>`.

## Methods

Each layer speaks its own vocabulary, and keeps it everywhere:

| Operation | Application service | Port / adapter | Controller handler |
| --- | --- | --- | --- |
| Read one, by id | `get` | `find` | `get<Module>` |
| Read many | `getAll` | `findAll` | `get<Module>s` |
| Write a new one | `create` | `save` | `create<Module>` |
| Change an existing one | a domain verb (`cancel`) | `save` | `<verb><Module>` |
| Delete one | `delete` | `delete` | `delete<Module>` |

- The port's `save` is an upsert: the adapter doesn't know whether the
  aggregate is new.
- A state change keeps its domain name all the way down to the aggregate
  method (`cancel` → `Order.cancel()`); never `update`.
- Domain factories are `create` (new) and `reconstitute` (from storage);
  value objects use `create` (validated) and `from` (wrap an existing
  value). Mappers use `toDomain` / `toPersistence`; response DTOs
  `fromDomain`.

## Comments

None in `src/` by default. The exceptions are the whole list:

1. **JSDoc on every export of a `*.util.ts` and a `*.decorator.ts`**: a
   one-line summary, then `@param` per argument, `@returns`, and `@throws`
   when it throws. Inside the body, no comments.
2. A tooling pragma (`eslint-disable-next-line`).
3. **The database engine switch**: the inactive engine's lines in
   `app.module.ts` and in each persistence module, commented out beside
   the active ones — see [[persistence]]. It is the only commented-out
   code allowed anywhere.

A decision worth explaining is a rule, and belongs in `.claude/rules/`.
