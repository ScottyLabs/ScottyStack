// https://orm.drizzle.team/docs/get-started/postgresql-new#step-5---setup-drizzle-config-file
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env["DATABASE_URL"] as string },
});
