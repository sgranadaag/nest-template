# Folder structure — modular (`main`)

Top-level folders under `src/` are split **by kind**: a file belongs to
exactly one of them based on *what it is*. Everything that knows what the
service does lives in `modules/`; everything else is shared and knows no
module.

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

A module is the classic Nest shape — `module`, `controller`, `service` —
plus what it needs to run on either database engine (see [[persistence]])
and to document itself in Swagger:

```
modules/<module>/
  <module>.module.ts           the Nest module: wiring + the engine switch
  <module>.controller.ts       HTTP in, DTO out
  <module>.service.ts          the module's business logic
  <module>.interface.ts        I<Module>, its parts, and I<Module>Repository
  <module>.constant.ts         enums, limits and the repository's DI token
  <module>.swagger.ts          <MODULE>_SWAGGER and <MODULE>_PROPERTY_SWAGGER
  <name>.dto.ts                while the module has a single DTO
  dto/                         from the second DTO on
  entities/                    one TypeORM entity per engine
    postgres<Module>.entity.ts
    mongo<Module>.entity.ts
  repositories/                one repository per engine
    postgres<Module>.repository.ts
    mongo<Module>.repository.ts
```

**A folder only wraps two or more files.** A file of a kind sits at the
module root while it is the only one of that kind
(`health/healthResponse.dto.ts`); when the second one arrives, **both** move
into the kind's folder (`order/dto/`). The rule runs both ways — a folder
left with one file is collapsed back. `entities/` and `repositories/`
always hold one file per engine, so they are always folders. `npm run
check:standards` enforces both directions.

- **No `domain/`, `application/` or `infrastructure/` folders.** Layering
  inside a module is the job of the `stable/hexagonal` branch, not this
  one.
- A module with no persistence (e.g. `health/`) has no repository,
  entities or token.

## Shared folders

- **`config/`** holds *functions* that take a `ConfigService` (or the app)
  and return or apply a library's options. A setting is decided here,
  never inline in `app.module.ts` or `main.ts`. The two `*.datasource.ts`
  files are the TypeORM CLI's entry points — the running app never imports
  them.
- **`constants/`** holds values every module may read: `ENV` (the name of
  every environment variable). A value only one module reads goes in that
  module's `<module>.constant.ts`.
- **`decorators/`** holds composed decorators, one `<name>.decorator.ts`
  per subject. Today: `SwaggerDocs`, the one Swagger decorator every
  handler carries.
- **`interfaces/`** holds the interfaces that more than one layer agrees
  on — the Swagger schema shape a decorator and every `<module>.swagger.ts`
  share, the exception body a util reads. An interface only one module uses
  lives in that module's `<module>.interface.ts`.
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

  A new helper joins the file of its kind. A new file means a genuinely
  new kind, not a new subject — that is what keeps `utils/` from turning
  into one file per function.

## Path aliases

One alias per top-level folder of `src/`: `@modules/*`, `@middlewares/*`,
`@utils/*`, `@decorators/*`, `@interfaces/*`, `@tests/*`, `@config/*`,
`@constants/*`.

- Any import crossing a `../` boundary goes through an alias. A `./`
  import of a sibling or of a subfolder of the same module is fine.
- The `config/*.datasource.ts` files are the one exception: the TypeORM CLI
  runs them with plain `ts-node`, outside the bundler and the alias
  resolver, so they import relatively.
- Adding an alias touches **three** places in lockstep: `tsconfig.json`
  `paths`, `package.json` `jest.moduleNameMapper` and
  `test/jest-e2e.json` `moduleNameMapper`. `npm run check:standards` fails
  when they drift or when an alias points at a folder that no longer
  exists.
