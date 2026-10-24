# Testing — hexagonal (`stable/hexagonal`)

Jest + ts-jest. Two suites, each with its own scope.

## Unit — `npm test`

- **What gets one**: the business logic, which in this architecture is
  exactly the inner two layers, plus utils:
  - every `domain/` aggregate (`<module>.entity.ts`) and value object
    (`*.valueObject.ts`);
  - every `application/` service;
  - every `utils/*.util.ts` — one test file per util file, a `describe` per
    function.

  `npm run check:standards` fails when one is missing.
- **What doesn't**: everything in `infrastructure/` (controllers, DTOs,
  swagger schemas, adapters, mappers, TypeORM entities), configs,
  decorators and middlewares. They are glue over the framework and the
  driver, and are exercised by the e2e suite instead.
- **Where**: `src/tests/<module>/<source file name>.test.ts` — flat per
  module, whatever layer the source is in (`order.entity.test.ts`,
  `orderItem.valueObject.test.ts`, `order.service.test.ts`) — and
  `src/tests/utils/<name>.util.test.ts`. Jest matches `.test.ts`, not
  `.spec.ts`.
- **Domain tests** construct the aggregate and value objects directly — no
  mocks at all. They cover each factory, each invariant (including the
  refusal paths) and each derived value.
- **Service tests**: one file per service, one nested `describe` per method,
  one `it` per behaviour including each exception path. Build the service
  by hand with the port mocked as a plain object of named `jest.fn()`s,
  typed as the port interface. No `Test.createTestingModule`, no database.

  ```ts
  findMock = jest.fn().mockResolvedValue(null);
  const orderRepository: IOrderRepository = { save: saveMock, find: findMock, … };
  service = new OrderService(orderRepository);
  ```
- Build test aggregates with `reconstitute` when the test needs a known id
  or state.
- A rule over a range of inputs gets a table-driven test (`it.each`) —
  e.g. `OrderItem.isValid`.

## e2e — `npm run test:e2e`

- **What gets one**: every module with a controller —
  `test/<module>.e2e-spec.ts`. `npm run check:standards` fails when one is
  missing.
- They boot the real `AppModule` with the same global `ValidationPipe`
  and `HttpExceptionFilter` as `main.ts`, and hit a real database — no
  mocks.
- **They run against whichever engine is switched on**, and must pass on
  every engine: after a persistence change, run `npm run test:e2e`, flip
  every switch point to the other engine (see [[persistence]]), run it
  again, and flip back. Each engine needs its migrations first (`npm run migration:postgres:run`,
  `npm run migration:mongo:run`).
- Each spec creates its own data and deletes it in `afterAll`; it never
  relies on rows another spec or a seed left behind.
- Assert on status codes and response bodies, never on what is stored.

## Running

Nest 12 is ESM-only, so Jest runs with `--experimental-vm-modules` (the
`test` script sets it) and loads it through Node's native `require(esm)`.
Call the npm scripts, not `npx jest`.

## Verifying a change

```
npm run typecheck && npm run lint && npm run check:standards && npm test && npm run build
```

plus `npm run test:e2e` on each engine when anything in `infrastructure/`
changed (`docker compose up -d` first).
