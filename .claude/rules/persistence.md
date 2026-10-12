# Persistence — two engines, one switched on

The template ships **Postgres and MongoDB, both through TypeORM**. Both are
fully written; exactly one is wired in. The switch is plain code, not
configuration: the active engine's lines are live and the other engine's
are **commented out right beside them**, so a reader sees both options in
the one place they are chosen. A project created from the template either
keeps the commented alternative or deletes it.

## Where the switch lives

There are two kinds of switch point, and every one of them must name the
same engine:

1. **`app.module.ts` — the connection.** Both config factories are
   imported, one commented out, and so is its `useFactory` line:

   ```ts
   import { postgresConfig } from '@config/postgres.config';
   // import { mongoConfig } from '@config/mongo.config';
   …
   TypeOrmModule.forRootAsync({
     imports: [ConfigModule],
     inject: [ConfigService],
     useFactory: postgresConfig,
     // useFactory: mongoConfig,
   }),
   ```

2. **Every `<module>.module.ts` with persistence — the entity and the
   repository.** Same pattern: both engines' imports, `forFeature` lines
   and provider bindings, one set commented out:

   ```ts
   import { PostgresOrderEntity } from './entities/postgresOrder.entity';
   import { PostgresOrderRepository } from './repositories/postgresOrder.repository';
   // import { MongoOrderEntity } from './entities/mongoOrder.entity';
   // import { MongoOrderRepository } from './repositories/mongoOrder.repository';
   …
   imports: [
     TypeOrmModule.forFeature([PostgresOrderEntity]),
     // TypeOrmModule.forFeature([MongoOrderEntity]),
   ],
   providers: [
     OrderService,
     { provide: ORDER_REPOSITORY, useClass: PostgresOrderRepository },
     // { provide: ORDER_REPOSITORY, useClass: MongoOrderRepository },
   ],
   ```

**Switching engine means flipping every switch point** — `app.module.ts`
and each persistence module. A half-switched app boots against one
database with the other engine's entities and fails at the first query.
The imports are commented together with their usage because an unused
import is a lint and type error.

These commented lines are the one place code is commented out on purpose
— see [[naming-conventions]].

## How a module stores its data

```
<module>.interface.ts                   I<Module>Repository: the contract
<module>.constant.ts                    <MODULE>_REPOSITORY: its DI token
entities/postgres<Module>.entity.ts     the Postgres row
entities/mongo<Module>.entity.ts        the Mongo document
repositories/postgres<Module>.repository.ts
repositories/mongo<Module>.repository.ts
migrations/postgres/<ts>-<Name>.ts      the table
migrations/mongo/<ts>-<Name>.ts         the collection's indexes
```

- **The contract is an interface; the token is a `Symbol`.** An interface
  doesn't exist at runtime, so Nest needs a token to inject it by: the
  service takes `@Inject(ORDER_REPOSITORY) orderRepository:
  IOrderRepository` (imported with `import type`), each repository
  `implements IOrderRepository`, and the module binds
  `{ provide: ORDER_REPOSITORY, useClass: … }`.
- **A repository speaks the module's interface, never its entity.** It
  converts in two private methods (`toEntity`/`toDocument` and
  `toOrder`-style), so no entity crosses into the service.
- **Every engine implements every file**, including the one commented out
  — it still compiles, lints and is reviewed. `npm run check:standards`
  fails when `entities/` or `repositories/` has a file with no sibling for
  each engine.

## Engine specifics

| | Postgres | MongoDB |
| --- | --- | --- |
| Connection | `config/postgres.config.ts` (`POSTGRES_*`) | `config/mongo.config.ts` (`MONGO_URI`, `MONGO_DATABASE`) |
| Primary key | `@PrimaryColumn('uuid') id` | `@ObjectIdColumn() _id` that no code reads, plus `@Column() id` holding the same UUID, made unique by a migration |
| Repository type | `Repository<Entity>` | `MongoRepository<Entity>` |
| Nested data | `jsonb` column | embedded array |
| Schema | `synchronize: false` + SQL migrations in `migrations/postgres/` | `synchronize: false` + index migrations in `migrations/mongo/` |
| CLI data source | `config/postgres.datasource.ts` | `config/mongo.datasource.ts` |
| Writes | `save()` | `insertOne()` / `updateOne({ id }, { $set })` — never `save()` on a document without its `_id` |

- `ObjectId` is imported as a type from `mongodb`, not from `typeorm`.
- **Both engines own their schema through migrations**, never
  `synchronize`: a migration is reviewed, versioned and reversible,
  where synchronize changes a database silently at boot.
  - Postgres: tables, columns and constraints, as SQL through
    `queryRunner.query(...)`.
  - Mongo: collections are schemaless, so a migration creates what a
    relational schema would have expressed — unique and sort indexes —
    through the `MongoQueryRunner` (`createCollectionIndex` /
    `dropCollectionIndex`, indexes named explicitly so `down()` can drop
    them). A data backfill is a migration too.
  - Every migration has a working `down()`.
- Migrations are written by hand (`npm run migration:create --
  src/migrations/<engine>/<Name>`), run per engine with
  `npm run migration:<engine>:run` (`:revert` to undo the last one), and
  never auto-run at boot.
- `config/<engine>.datasource.ts` is the TypeORM CLI's entry point for one
  engine. The running app never imports it; it lists migrations only, no
  entities, and imports `ENV` relatively because the CLI runs outside the
  alias resolver.
- Relations: none across engines. A reference to another record is its id
  as a plain column; the service asks the other module for it.

## Adding a third engine

1. Add its variables to `ENV` and `.env.example`, and write
   `config/<engine>.config.ts` and `config/<engine>.datasource.ts`, plus
   its `migration:<engine>:*` scripts.
2. Add a commented `useFactory` alternative in `app.module.ts`.
3. Write the entity, repository and migrations for every persistence
   module, and add their commented lines to each module file.
4. Add the engine to `DATABASE_ENGINES` in `scripts/check-standards.mjs`
   and its service to `docker-compose.yml`.
