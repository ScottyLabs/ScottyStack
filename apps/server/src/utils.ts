import type { User } from "@scottystack/access-control";
import { eq } from "drizzle-orm";
import type { Request as ExpressRequest } from "express";
import { db } from "./db";
import { account, user } from "./db/schema";
import { ADMIN_GROUP, verifyBearer, verifyOidc } from "./lib/authentication.ts";

/**
 * Get user from the request for access control.
 */
export async function getUserFromRequest(
  req: ExpressRequest,
): Promise<User | null> {
  const decoded = (await verifyBearer(req)) ?? (await verifyOidc(req));
  if (!decoded) {
    return null;
  }

  // Use the user's IDP sub to find the user's ID
  const rows = await db
    .select({ user })
    .from(user)
    .innerJoin(account, eq(user.id, account.userId))
    .where(eq(account.accountId, decoded.sub as string));

  return {
    id: rows[0]?.user.id ?? "",
    roles: decoded["groups"].includes(ADMIN_GROUP)
      ? ["admin", "user"]
      : ["user"],
  };
}
