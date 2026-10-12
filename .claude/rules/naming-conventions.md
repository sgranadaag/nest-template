# Naming conventions — modular (`main`)

## Files

`<name>.<role>.ts`, both parts `camelCase`. The role says what the file is
and decides which folder it lives in — see [[folder-structure]].
`npm run check:standards` rejects an unknown role or a role in the wrong
folder.

| Role | Where | Example |
| --- | --- | --- |
| `module` | `modules/<module>/` — named for its folder | `order.module.ts` |
| `controller` | `modules/<module>/` | `order.controller.ts` |
| `service` | `modules/<module>/` | `order.service.ts` |
| `interface` | `modules/<module>/`, or `interfaces/` when shared | `order.interface.ts`, `swaggerDocs.interface.ts` |
| `constant` | `modules/<module>/`, or `constants/` when app-wide | `order.constant.ts`, `environment.constant.ts` |
| `swagger` | `modules/<module>/` | `order.swagger.ts` |
| `dto` | `modules/<module>/`, or `dto/` from the second one | `healthResponse.dto.ts`, `dto/createOrder.dto.ts` |
| `entity` | `modules/<module>/entities/` — always engine-prefixed | `mongoOrder.entity.ts` |
| `repository` | `modules/<module>/repositories/` — always engine-prefixed | `postgresOrder.repository.ts` |
| `config` | `config/` | `postgres.config.ts` |
| `datasource` | `config/` — one per engine | `mongo.datasource.ts` |
| `decorator` | `decorators/` | `swaggerDocs.decorator.ts` |
| `middleware` | `middlewares/` | `logger.middleware.ts` |
| `filter` | `middlewares/` | `httpException.filter.ts` |
| `util` | `utils/` — named for its kind | `http.util.ts` |
| `test` | `tests/**` — `<source file name>.test.ts` | `order.service.test.ts` |
| `e2e-spec` | `test/` — one per module with a controller | `order.e2e-spec.ts` |

Two exceptions, and they are the whole list:

- `src/main.ts` and `src/app.module.ts`, which Nest names.
- `migrations/<engine>/<13-digit timestamp>-<PascalCaseName>.ts`, the
  shape TypeORM's CLI generates and orders by.

**Engine-specific files carry the engine as a prefix** —
`postgresOrder.repository.ts` / class `PostgresOrderRepository`. The prefix
is the engine name (`postgres`, `mongo`), so the standards check can pair
every file with its sibling for each engine.

## Identifiers

- **Classes**: `PascalCase`, suffixed with the role — `OrderService`,
  `CreateOrderDto`, `PostgresOrderEntity`, `MongoOrderRepository`.
- **Interfaces**: `I` + `PascalCase` name, nothing else — `IOrder`,
  `IOrderItem`, `IOrderRepository`, `ISwaggerEndpoint`. No `Interface`
  suffix, no un-prefixed interface. `npm run check:standards` enforces it.
- **DI tokens**: `SCREAMING_SNAKE_CASE` `Symbol`s in the module's
  constants file, named for what they resolve to — `ORDER_REPOSITORY`.
- **Enums**: `SCREAMING_SNAKE_CASE`, plural for the set, string-valued —
  `ORDER_STATUSES`. Code compares against members, never the bare string.
- **Constants**: `SCREAMING_SNAKE_CASE` — `ENV`, `ORDER_ITEM_MAX_QUANTITY`.
- **Swagger schemas**: `<MODULE>_SWAGGER` (one entry per endpoint, plus
  `API_TAG`) and `<MODULE>_PROPERTY_SWAGGER` (one entry per DTO field).
- **Environment variables** are read through `ENV.<KEY>`, never a raw
  string passed to `ConfigService.get()` or `process.env`.

## Methods

CRUD operations use one name everywhere — controller, service and
repository alike:

| Operation | Name |
| --- | --- |
| Read one, by id | `find` |
| Read many | `findAll` |
| Write a new one | `create` |
| Change an existing one | `update` |
| Delete one | `remove` |

A method that carries domain meaning keeps its own name (`cancel`, not
`update`): the test is whether `update` would tell the reader what just
became true.

## Comments

None in `src/` by default — names and these rules carry the context. The
exceptions are the whole list:

1. **JSDoc on every export of a `*.util.ts` and a `*.decorator.ts`**: a
   one-line summary, then `@param` per argument, `@returns`, and `@throws`
   when it throws. They are called from places that shouldn't have to read
   their source, so their contract is written down. Inside the body, no
   comments.
2. A tooling pragma (`eslint-disable-next-line`).
3. **The database engine switch**: the inactive engine's lines in
   `app.module.ts` and in each persistence module, commented out beside
   the active ones — see [[persistence]]. It is the only commented-out
   code allowed anywhere.

A decision worth explaining is a rule, and belongs in `.claude/rules/`.
