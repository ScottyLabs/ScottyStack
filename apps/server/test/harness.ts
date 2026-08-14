import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const migrationsFolder = path.resolve(
  fileURLToPath(new URL("../../../packages/db/drizzle", import.meta.url)),
);

const pglite = new PGlite();
export const testDb = drizzle({ client: pglite });

await migrate(testDb, { migrationsFolder });
