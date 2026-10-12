# Testing — modular (`main`)

Jest + ts-jest. Two suites, each with its own scope.

## Unit — `npm test`

- **What gets one**: every `<module>.service.ts` (the business logic) and
  every `utils/*.util.ts` — one test file per util file, a `describe` per
  function. `npm run check:standards` fails when one is
  missing.
- **What doesn't**: controllers, DTOs, swagger schemas, repositories,
  entities, configs, decorators and middlewares. They are wiring over the framework and the driver, and are
  exercised by the e2e suite instead.
- **Where**: `src/tests/<module>/<name>.service.test.ts` and
  `src/tests/utils/<name>.util.test.ts`, importing through `@modules/*` /
  `@utils/*`. The test is named for the file it tests plus `.test.ts`;
  Jest matches `.test.ts`, not `.spec.ts`.
- **Shape**: one file per service, one nested `describe` per method, one
  `it` per behaviour — including each exception path.
- **Mocking the repository**: build the service by hand with a plain object
  of named `jest.fn()`s typed as the module's `I<Module>Repository`. No
  `Test.createTestingModule`, no database, no TypeORM.

  ```ts
  findMock = jest.fn().mockResolvedValue(null);
  const orderRepository: IOrderRepository = { create: createMock, find: findMock, … };
  service = new OrderService(orderRepository);
  ```
- A util that encodes a rule over a range of inputs gets a table-driven
  test (`it.each`).

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

plus `npm run test:e2e` on each engine when a controller, a DTO, a
repository or an entity changed (`docker compose up -d` first).
