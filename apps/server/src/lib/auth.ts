import type { Role } from "@scottystack/access-control/src/types.ts";
import type { Session, User } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession, genericOAuth } from "better-auth/plugins";
import { db } from "../db/index.ts";
import * as schema from "../db/schema/index.ts";
import { env } from "../env.ts";
import { getRolesFromJwt } from "./accessControl.ts";
import { getJwtPayloadFromHeaders } from "./authUtils.ts";

/**
 * Custom session type.
 *
 * Used by the web client via the `useSession` hook.
 * Used by the server via
 */
interface Auth {
  session: Session;
  user: User & { roles: Role[] };
}

// https://www.better-auth.com/docs/installation#create-a-better-auth-instance
export const auth = betterAuth({
  baseURL: env.SERVER_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],

  // Override the user id to Andrew ID when creating a new user
  database: drizzleAdapter(db, { schema, provider: "pg" }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            // @ts-expect-error The user here actually has all the JWT fields
            id: user["full_email"].split("@")[0],
          },
        }),
      },
    },
  },

  // https://better-auth.com/docs/plugins/generic-oauth#add-the-plugin-to-your-auth-config
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "keycloak",
          clientId: env.AUTH_CLIENT_ID,
          clientSecret: env.AUTH_CLIENT_SECRET,
          discoveryUrl: `${env.AUTH_ISSUER}/.well-known/openid-configuration`,
          redirectURI: `${env.SERVER_URL}/api/auth/oauth2/callback/keycloak`,
          scopes: ["openid", "email", "profile", "offline_access"],
        },
      ],
    }),

    // Reference: https://better-auth.com/docs/concepts/session-management#customizing-session-response
    customSession(async ({ user, session }, ctx): Promise<Auth> => {
      const jwtPayload = await getJwtPayloadFromHeaders(ctx.headers);
      return {
        session,
        user: { ...user, roles: getRolesFromJwt(jwtPayload) },
      };
    }),
  ],
});
