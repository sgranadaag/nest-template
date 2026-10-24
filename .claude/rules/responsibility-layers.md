# Responsibility layers — hexagonal (`stable/hexagonal`)

Pragmatic hexagonal architecture (ports & adapters), the same shape as
`nest-hexagonal`'s `stable/main`. Every module is split into three layers,
and **every dependency points inward**: `infrastructure → application →
domain`. This file names no feature; if a new flow does not fit, the flow
is wrong before the rule is.

```
             ┌──────────────────────── infrastructure ───────────────────────┐
HTTP ──► controller ──► application service ──► port (interface + token)    │
             │  dto         │                       ▲                         │
             │              ▼                       │ implements              │
             │           domain                adapters/<engine>/<engine><Module>.adapter
             │    (aggregate, value objects)        │  + .entity + .mapper     │
             └──────────────────────────────────────┴──────────► database ───┘
```

**Pragmatic** means two deliberate simplifications of the pure version:

- **Only outbound (driven) ports exist.** The controller calls the
  application service class directly — there is no inbound port, no
  use-case interface, no command bus in between.
- **One application service per aggregate**, holding every operation as a
  method (`create`, `get`, `getAll`, `cancel`, `delete`) — not one class
  per use case.

## Layer table

| Layer | Owns | Must NOT do |
| --- | --- | --- |
| `domain/` | The aggregate root (`<module>.entity.ts`), its value objects, its enums and the primitive shapes it hands out. Every invariant: what a valid item is, which state changes are allowed, how a total is computed | Import Nest, TypeORM, a driver, `class-validator`, or anything from `application/` or `infrastructure/`. Be decorated or injected |
| `application/` | The application service: orchestrating the aggregate and its ports; deciding "not found" / "conflict" and throwing Nest's HTTP exceptions; the ports (`<name>.port.ts`: interface + `Symbol` token) it needs from the outside | Import `infrastructure/`, TypeORM or a driver; know a DTO, a status code beyond the exception class, or which database runs |
| `infrastructure/` controller | Routes, params (`ParseUUIDPipe`), status codes, one `@SwaggerDocs` per handler; turning the request DTO into primitives for the service and the aggregate into a response DTO (`fromDomain`) | Contain a business rule; import a port, an adapter or the driver |
| `infrastructure/` DTOs + `<module>.swagger.ts` | Request validation, the response shape, the OpenAPI text | Be passed into `application/` or `domain/` |
| `infrastructure/adapters/<engine>/` | One adapter per engine implementing the port, with its TypeORM entity and its mapper (`toDomain` / `toPersistence`) | Decide anything: no "not found" exception (return `null`), no validation, no business rule. Return an ORM entity |
| `<module>.module.ts` | The composition root: binds the port's token to the active engine's adapter (the engine switch) | Hold logic |
| `decorators/`, `interfaces/`, `middlewares/`, `utils/`, `config/`, `constants/` | Shared, module-agnostic code — see [[folder-structure]] | Import from `modules/` |

## The direction of dependency

ESLint enforces every arrow as an error:

- **`domain/`** may import only other `domain/` files, `@utils/*` and
  `@constants/*`. No `@nestjs/*`, no `class-validator`, no TypeORM or
  driver, nothing from `application/` or `infrastructure/`.
- **`application/`** may import `domain/` and its own ports. No
  `infrastructure/`, no TypeORM or driver.
- **The controller** may import its application service and DTOs. No port,
  no adapter, no TypeORM or driver.
- **Shared folders never import a module.**

An adapter depends **outward** on the port to implement it; the service
depends **inward** on the port to use it. Neither knows the other.

## Domain objects

- **The aggregate root** has a private constructor and two factories:
  `create(...)` for a new instance (mints the id, sets the initial state,
  enforces creation invariants) and `reconstitute(...)` to rehydrate from
  storage without minting anything.
- **State changes are methods** that enforce their own invariant
  (`cancel()` refuses anything but a pending order). The aggregate also
  exposes the question (`canBeCancelled()`), so the service can answer
  with the right HTTP exception before calling it — the domain throws a
  plain `Error` only as a last line of defence.
- **Value objects are immutable**: no setters, a static `create()` that
  validates (with a public static `isValid()` holding the rule), `from()`
  to wrap an existing value, getters, and `toPrimitives()` when another
  layer needs the plain shape.
- **Getters return copies** of collections, so nothing outside the
  aggregate can change it.
- Ids are value objects (`OrderId`) wrapping a UUID v4 from
  `generateId` in `utils/crypto.util.ts`, the same on every engine.

## Errors

Application services throw Nest's built-in HTTP exceptions directly — no
parallel domain-exception hierarchy. The global `HttpExceptionFilter`
turns every error into `{ statusCode, error, message, path, timestamp }`,
reading them through `utils/http.util.ts`. An adapter never throws for an
absent record; it returns `null`.

## Swagger

Every handler carries exactly one `@SwaggerDocs(<MODULE>_SWAGGER.<ENDPOINT>,
ResponseDto?)`, every controller one `@ApiTags(<MODULE>_SWAGGER.API_TAG)`.
DTO fields take `@ApiProperty(<MODULE>_PROPERTY_SWAGGER.<FIELD>)`. Swagger
lives entirely in `infrastructure/` — the domain never knows it is
documented. The document is served at `/docs`.

## When adding a module

Build it from the inside out:

1. `domain/`: the aggregate, its value objects and constants, with their
   unit tests.
2. `application/`: the port (interface + token) and the service, with its
   unit test against a mocked port.
3. `infrastructure/adapters/<engine>/`: per engine, the entity, the mapper and the
   adapter — plus a migration per engine. See [[persistence]].
4. `infrastructure/`: `<module>.swagger.ts`, DTOs, the controller, and its
   e2e spec.
5. The module file — the composition root — then register it in
   `app.module.ts`.
