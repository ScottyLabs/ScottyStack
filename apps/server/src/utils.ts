import { fromNodeHeaders } from "better-auth/node";
import type { Request as ExpressRequest } from "express";
// import type jwt from "jsonwebtoken";
import { auth } from "./lib/auth.ts";
// import { ADMIN_GROUP } from "./lib/authentication.ts";

/**
 * Check if the request is authenticated and the user is an admin.
 * We need to use it when we need to check if the user is an admin in a public route.
 */
export async function isAdminFromRequest(
  req: ExpressRequest,
): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return Boolean((session?.user as { isAdmin?: boolean })?.isAdmin);
}

// function decodedTokenToUser(decoded: jwt.JwtPayload): Express.User {
//   return {
//     sub: decoded.sub as string,
//     email: decoded["email"],
//     givenName: decoded["given_name"],
//     isAdmin: decoded["groups"].includes(ADMIN_GROUP),
//   };
// }
