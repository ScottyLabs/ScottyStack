import type { Session, User } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession, genericOAuth } from "better-auth/plugins";
import jwt from "jsonwebtoken";
import { db } from "../db/index.ts";
import * as schema from "../db/schema/index.ts";
import { env } from "../env.ts";

/**
 * Custom session type
 *
 * Used by the frontend client.
 */
interface Auth {
  session: Session;
  user: User & { groups?: string[] };
}

// https://www.better-auth.com/docs/installation#create-a-better-auth-instance
export const auth = betterAuth({
  database: drizzleAdapter(db, { schema, provider: "pg" }),

  baseURL: env.SERVER_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],

  // Add full email as an additional field to the user object
  // in order to consitently retrieve the Andrew ID
  user: {
    additionalFields: {
      fullEmail: {
        type: "string",
        required: true,
      },
    },
  },

  // Change the user id to Andrew ID when creating a new user
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              // @ts-expect-error - fullEmail is an additional field
              id: user["fullEmail"].split("@")[0],
            },
          };
        },
      },
    },
  },

  plugins: [
    // https://www.better-auth.com/docs/plugins/generic-oauth#pre-configured-provider-helpers
    genericOAuth({
      config: [
        {
          providerId: "keycloak",
          clientId: env.AUTH_CLIENT_ID,
          clientSecret: env.AUTH_CLIENT_SECRET,
          discoveryUrl: `${env.AUTH_ISSUER}/.well-known/openid-configuration`,
          redirectURI: `${env.SERVER_URL}/api/auth/oauth2/callback/keycloak`,
          scopes: ["openid", "email", "profile", "offline_access"],
          mapProfileToUser: (profile) => {
            return {
              id: profile["sub"],
              name: profile["name"],
              email: profile["email"],
              emailVerified: profile["email_verified"],
              image: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              fullEmail: profile["full_email"],
            };
          },
        },
      ],
    }),

    // Add groups to the session so it can used easily in the frontend via `useSession` hook.
    // Reference: https://www.better-auth.com/docs/concepts/session-management#customizing-session-response
    customSession(async ({ user, session }, ctx): Promise<Auth> => {
      const customSessionObject: Auth = { session, user };

      // Get the decoded access token from the user
      const decoded = await auth.api
        .getAccessToken({
          body: { providerId: "keycloak" },
          headers: ctx.headers,
        })
        .then((accessToken) => {
          return jwt.decode(accessToken.accessToken);
        });

      // Add groups to the session if they are present in the access token
      if (decoded && typeof decoded === "object" && "groups" in decoded) {
        customSessionObject.user.groups = decoded["groups"];
      }

      return customSessionObject;
    }),
  ],
});
