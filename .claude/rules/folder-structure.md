# Folder structure — hexagonal (`stable/hexagonal`)

Top-level folders under `src/` are split **by kind**, exactly as on
`main`. What changes is the inside of a module: three layer folders —
see [[responsibility-layers]].

```
src/
  main.ts                         bootstrap: global pipe + filter, Swagger, listen
  app.module.ts                   config, database connection (engine switch), the module list
  config/                         functions that build a library's options
    postgres.config.ts             TypeORM options for Postgres
    mongo.config.ts                TypeORM options for MongoDB
    swagger.config.ts              the OpenAPI document, served at /docs
    postgres.datasource.ts         the TypeORM CLI's DataSource for Postgres migrations
    mongo.datasource.ts            the TypeORM CLI's DataSource for Mongo migrations
  constants/                      app-wide fixed values: ENV keys
  decorators/                     composed decorators shared by every module (SwaggerDocs)
  interfaces/                     interfaces shared by more than one layer
  middlewares/                    request-level middleware and exception filters
  utils/                          pure helpers, one file per kind — see below
  migrations/
    postgres/                     hand-written SQL migrations
    mongo/                        index migrations
  modules/
    <module>/                     see "A module" below
  tests/                          unit tests, mirroring what they test
test/                             e2e specs: <module>.e2e-spec.ts + jest-e2e.json
```

## A module

```
modules/<module>/
  <module>.module.ts                  the composition root: wiring + the engine switch
  domain/
    <module>.entity.ts                the aggregate root
    <module>.constant.ts              its enums and limits
    <module>.interface.ts             the primitive shapes it hands out
    valueObjects/                     from the second value object on
      <module>Id.valueObject.ts
      <name>.valueObject.ts
  application/
    <module>.service.ts               one service per aggregate, every operation a method
    <name>Repository.port.ts          a port: I<Name>Repository + its token
    ports/                            from the second port on
  infrastructure/
    <module>.controller.ts            the inbound edge: HTTP in, DTO out
    <module>.swagger.ts               <MODULE>_SWAGGER and <MODULE>_PROPERTY_SWAGGER
    <name>.dto.ts                     while the module has a single DTO
    dto/                              from the second DTO on
    adapters/                         one folder per engine
      postgres/
        postgres<Module>.adapter.ts    implements the port
        postgres<Module>.entity.ts     the TypeORM row
        postgres<Module>.mapper.ts     toDomain / toPersistence
      mongo/
        mongo<Module>.adapter.ts
        mongo<Module>.entity.ts
        mongo<Module>.mapper.ts
```

- **`domain/`, `application/` and `infrastructure/` always exist** in a
  module that has them — they are the layers, not groupings.
- **Inside a layer, a folder only wraps two or more files of one kind.** A
  file sits at the layer root while it is the only one of its kind
  (`application/orderRepository.port.ts`); when the second arrives,
  **both** move into the kind's folder (`valueObjects/`, `ports/`, `dto/`,
  `interfaces/`). The rule runs both ways. `adapters/` holds one folder
  per engine (`postgres/`, `mongo/`), each with a full set, so they are
  always folders. `npm run check:standards` enforces
  both directions.
- **The controller lives directly in `infrastructure/`** — not in
  `adapters/`, which is reserved for classes implementing a port.
- **Two `.entity.ts` files, never confused**: the aggregate root in
  `domain/`, and the engine-prefixed TypeORM entities in
  `infrastructure/adapters/<engine>/`. The folder and the prefix both tell them
  apart.
- A module with no persistence (e.g. `health/`) has `domain/`,
  `application/` and `infrastructure/` but no port and no `adapters/`.

## Shared folders

- **`config/`** holds *functions* that take a `ConfigService` (or the app)
  and return or apply a library's options. The two `*.datasource.ts` files
  are the TypeORM CLI's entry points — the running app never imports them.
- **`constants/`** holds values every module may read: `ENV`. A value one
  module owns goes in its `domain/<module>.constant.ts`.
- **`decorators/`** holds composed decorators, one `<name>.decorator.ts`
  per subject — today `SwaggerDocs`.
- **`interfaces/`** holds the interfaces more than one layer agrees on —
  the Swagger schema shape, the exception body a util reads.
- **`middlewares/`** holds middleware and global exception filters, kept
  thin: what they compute is delegated to a util.
- **`utils/`** holds pure functions, **one file per kind** — not per
  subject and not per function:

  | File | Kind | Today |
  | --- | --- | --- |
  | `crypto.util.ts` | randomness, hashing, ids | `generateId` |
  | `http.util.ts` | reading requests, responses and HTTP errors | `extractStatusCode`, `extractErrorMessage`, `extractErrorName` |
  | `numeric.util.ts` | numbers and money | `roundMoney` |
  | `date.util.ts` | dates, expiries, formatting | — |
  | `string.util.ts` | text: slugs, casing, trimming | — |
  | `auth.util.ts` | credentials and tokens | — |

  A new helper joins the file of its kind. The domain may call a util — it
  is plain, deterministic code with no I/O — which is why id generation
  needs no port.

## Path aliases

One alias per top-level folder of `src/`: `@modules/*`, `@middlewares/*`,
`@utils/*`, `@decorators/*`, `@interfaces/*`, `@tests/*`, `@config/*`,
`@constants/*`.

- Any import crossing a `../` boundary goes through an alias — including
  between layers of the same module (`@modules/order/domain/order.entity`
  from `application/`). A `./` import inside one folder is fine.
- The `config/*.datasource.ts` files import relatively: the TypeORM CLI
  runs them outside the bundler and the alias resolver.
- Adding an alias touches **three** places in lockstep: `tsconfig.json`
  `paths`, `package.json` `jest.moduleNameMapper` and
  `test/jest-e2e.json` `moduleNameMapper`. `npm run check:standards` fails
  when they drift.
