import * as Sentry from "@sentry/bun";
import { env } from "./env";

// Reference: https://docs.sentry.io/platforms/javascript/guides/bun/
Sentry.init({ dsn: env.SENTRY_DSN });

console.log("Sentry initialized");
