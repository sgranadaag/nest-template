---
description: Start the API in watch mode
---

Check which engine `src/app.module.ts` has switched on (the uncommented `useFactory`) and that its database is reachable (`docker compose ps`; start it with `docker compose up -d` if not). On Postgres, run `npm run migration:postgres:run` first if the schema may be behind (`npm run migration:mongo:run` on Mongo). Then run `npm run start:dev` with `run_in_background: true` since it doesn't exit on its own, and report the local URL (`http://localhost:<PORT>`) and the active engine.
