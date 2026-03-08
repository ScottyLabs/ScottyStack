import type { Request as ExpressRequest } from "express";
import { ADMIN_GROUP, verifyBearer, verifyOidc } from "./lib/authentication.ts";

export type RequestUser = {
  sub: string;
  email?: string;
  givenName?: string;
  isAdmin: boolean;
};

/**
 * Get the authenticated user from the request.
 * Works for both OIDC (session/cookies) and Bearer token authentication.
 * Returns null if the request is not authenticated.
 */
export async function getUserFromRequest(
  req: ExpressRequest,
): Promise<RequestUser | null> {
  const decoded = (await verifyBearer(req)) ?? (await verifyOidc(req));
  if (!decoded) {
    return null;
  }

  return {
    sub: decoded.sub as string,
    email: decoded["email"],
    givenName: decoded["given_name"],
    isAdmin: (decoded["groups"] ?? []).includes(ADMIN_GROUP),
  };
}
