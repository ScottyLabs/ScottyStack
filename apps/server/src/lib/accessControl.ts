import type { User } from "@scottystack/access-control";
import type { Role } from "@scottystack/access-control/src/types.ts";
import { eq } from "drizzle-orm";
import type { Request as ExpressRequest } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index.ts";
import { account, user } from "../db/schema/index.ts";
import { auth } from "./auth.ts";
import { ADMIN_GROUP, verifyBearer, verifyOidc } from "./authentication.ts";

/**
 * Get user from the request for access control.
 */
export async function getAcUserFromRequest(req: ExpressRequest): Promise<User> {
  const jwtPayload = (await verifyBearer(req)) ?? (await verifyOidc(req));
  return await jwtPayloadToAcUser(jwtPayload);
}

/**
 * Convert the decoded JWT payload to an access control user.
 */
export async function jwtPayloadToAcUser(
  jwtPayload: jwt.JwtPayload | string | undefined | null,
): Promise<User> {
  const sub = jwtPayload?.sub;
  if (typeof sub !== "string") {
    return {
      id: "",
      roles: ["guest"],
    };
  }

  // Use the user's IDP sub to find the user's ID
  const rows = await db
    .select({ user })
    .from(user)
    .innerJoin(account, eq(user.id, account.userId))
    .where(eq(account.accountId, sub));

  // TODO: throw an error if the user is not found
  const dbUser = rows[0]?.user;
  if (!dbUser) {
    return {
      id: "",
      roles: ["guest"],
    };
  }

  return {
    id: dbUser.id,
    roles: getRolesFromJwt(jwtPayload),
  };
}

export function getRolesFromJwt(
  jwtPayload: jwt.JwtPayload | null | undefined | string,
): Role[] {
  if (!jwtPayload || typeof jwtPayload !== "object") {
    return ["guest"];
  }

  return jwtPayload["groups"].includes(ADMIN_GROUP)
    ? ["admin", "user"]
    : ["user"];
}

export async function getJwtPayloadFromHeaders(
  headers?: Headers,
): Promise<jwt.JwtPayload | null> {
  return await auth.api
    .getAccessToken({
      body: { providerId: "keycloak" },
      headers: headers,
    })
    .then((accessToken) => jwt.decode(accessToken.accessToken, { json: true }));
}
