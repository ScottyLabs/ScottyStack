import type { User } from "@scottystack/access-control";
import type { Role } from "@scottystack/access-control/src/types.ts";
import { eq } from "drizzle-orm";
import type { Request as ExpressRequest } from "express";
import type jwt from "jsonwebtoken";

import { db } from "../db/index.ts";
import { account, user } from "../db/schema/index.ts";
import { env } from "../env.ts";
import { verifyBearer, verifyOidc } from "./authentication.ts";

/**
 * Get user from the request for access control.
 */
export async function getAcUserFromRequest(req: ExpressRequest): Promise<User> {
  const jwtPayload = (await verifyBearer(req)) ?? (await verifyOidc(req));

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

  // There should always be a user found in the database for the given sub
  // since we create a user when the user logs in for the first time.
  const dbUser = rows[0]?.user;
  if (!dbUser) {
    throw new Error("User not found");
  }

  return {
    id: dbUser.id,
    roles: getRolesFromJwt(jwtPayload),
  };
}

export function getRolesFromJwt(jwtPayload: jwt.JwtPayload | null | undefined | string): Role[] {
  // When the user is not authenticated, return a guest role.
  if (!jwtPayload || typeof jwtPayload !== "object") {
    return ["guest"];
  }

  // When the user is authenticated but not in any groups, return a user role.
  const groups = jwtPayload["groups"];
  if (!groups) {
    return ["user"];
  }

  // When the user is in the admin group, return an admin role.
  return groups.includes(env.ADMIN_GROUP) ? ["admin", "user"] : ["user"];
}
