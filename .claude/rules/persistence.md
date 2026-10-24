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

2. **Every `<module>.module.ts` with persistence — the composition root.**
   Same pattern: both engines' entity and adapter imports, `forFeature`
   lines and port bindings, one set commented out:

   ```ts
   import { PostgresOrderEntity } from './infrastructure/adapters/postgres/postgresOrder.entity';
   import { PostgresOrderAdapter } from './infrastructure/adapters/postgres/postgresOrder.adapter';
   // import { MongoOrderEntity } from './infrastructure/adapters/mongo/mongoOrder.entity';
   // import { MongoOrderAdapter } from './infrastructure/adapters/mongo/mongoOrder.adapter';
   …
   imports: [
     TypeOrmModule.forFeature([PostgresOrderEntity]),
     // TypeOrmModule.forFeature([MongoOrderEntity]),
   ],
   providers: [
     OrderService,
     { provide: ORDER_REPOSITORY, useClass: PostgresOrderAdapter },
     // { provide: ORDER_REPOSITORY, useClass: MongoOrderAdapter },
   ],
   ```

   This is exactly what a port buys: swapping the engine touches the
   composition root and nothing else — not the service, not the domain.

**Switching engine means flipping every switch point** — `app.module.ts`
and each persistence module. A half-switched app boots against one
database with the other engine's entities and fails at the first query.
The imports are commented together with their usage because an unused
import is a lint and type error.

These commented lines are the one place code is commented out on purpose
— see [[naming-conventions]].

## How a module stores its data

```
application/<name>Repository.port.ts                I<Name>Repository + <NAME>_REPOSITORY token
infrastructure/adapters/postgres/postgres<Module>.adapter.ts implements the port for Postgres
infrastructure/adapters/postgres/postgres<Module>.entity.ts  the Postgres row
infrastructure/adapters/postgres/postgres<Module>.mapper.ts  row <-> aggregate
infrastructure/adapters/mongo/mongo<Module>.adapter.ts       implements the port for MongoDB
infrastructure/adapters/mongo/mongo<Module>.entity.ts        the Mongo document
infrastructure/adapters/mongo/mongo<Module>.mapper.ts        document <-> aggregate
migrations/postgres/<ts>-<Name>.ts                  the table
migrations/mongo/<ts>-<Name>.ts                     the collection's indexes
```

- **The port is an interface; its token is a `Symbol`**, both exported
  from the port file. The service takes `@Inject(ORDER_REPOSITORY)
  orderRepository: IOrderRepository` (imported with `import type`), each
  adapter `implements IOrderRepository`, and the module binds
  `{ provide: ORDER_REPOSITORY, useClass: … }`.
- **The port speaks the aggregate.** It takes and returns domain objects
  (`Order`); the adapter never lets a TypeORM entity cross into the
  application layer.
- **The mapper is the only place that converts**: `toDomain(entity)`
  rebuilds the aggregate with `reconstitute` (and its value objects with
  `create`, so stored data is re-validated); `toPersistence(order)` reads
  it back through its getters. The adapter delegates every conversion to
  it.
- **`save` is an upsert.** The adapter doesn't know whether the aggregate
  is new: Postgres `save()` merges by primary key; Mongo uses
  `updateOne({ id }, { $set }, { upsert: true })`.
- **Every engine implements every file**, including the one commented out
  — it still compiles, lints and is reviewed. `npm run check:standards`
  fails when a file in `infrastructure/adapters/<engine>/` has no sibling
  in each other engine's folder.

## Engine specifics

| | Postgres | MongoDB |
| --- | --- | --- |
| Connection | `config/postgres.config.ts` (`POSTGRES_*`) | `config/mongo.config.ts` (`MONGO_URI`, `MONGO_DATABASE`) |
| Primary key | `@PrimaryColumn('uuid') id` | `@ObjectIdColumn() _id` that no code reads, plus `@Column() id` holding the same UUID, made unique by a migration |
| Repository type | `Repository<Entity>` | `MongoRepository<Entity>` |
| Nested data | `jsonb` column | embedded array |
| Schema | `synchronize: false` + SQL migrations in `migrations/postgres/` | `synchronize: false` + index migrations in `migrations/mongo/` |
| CLI data source | `config/postgres.datasource.ts` | `config/mongo.datasource.ts` |
| Writes | `save()` | `updateOne({ id }, { $set }, { upsert: true })` — never `save()` on a document without its `_id` |

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
3. Write the entity, mapper, adapter and migrations for every persistence
   module, and add their commented lines to each module file.
4. Add the engine to `DATABASE_ENGINES` in `scripts/check-standards.mjs`
   and its service to `docker-compose.yml`.
