// https://tsoa-community.github.io/docs/authentication.html#authentication
// https://medium.com/@alexandre.penombre/tsoa-the-library-that-will-supercharge-your-apis-c551c8989081

import { fromNodeHeaders } from "better-auth/node";
import type * as express from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { env } from "../env.ts";
import type { HttpError } from "../middlewares/errorHandler.ts";
import {
  AuthenticationError,
  AuthorizationError,
  InternalServerError,
} from "../middlewares/errorHandler.ts";
import { auth } from "./auth.ts";

export const OIDC_AUTH = "oidc";
export const BEARER_AUTH = "bearerAuth";

// You can change this to scottystack-members if you are not an admin but
// need to test as an admin in development. You can also change it to a random
// string if you are an admin but need to test as a non-admin in development.
export const ADMIN_GROUP = "scottystack-admins";

declare module "express" {
  interface Request {
    // Authentication errors are stored in the request object
    // so we can return the most relevant error to the client in errorHandler
    authErrors?: HttpError[];

    // Whether the request successfully authenticated.
    // Used in errorHandler to determine if we should show authErrors.
    authenticated?: boolean;
  }
}

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[],
) {
  // Store all authentication errors in the request object
  // so we can return the most relevant error to the client in errorHandler
  request.authErrors = request.authErrors ?? [];

  return new Promise((resolve, reject) => {
    if (securityName === OIDC_AUTH) {
      return verifyOidc(request).then((decoded) =>
        verifyScope(request, decoded, resolve, reject, scopes),
      );
    }

    if (securityName === BEARER_AUTH) {
      return verifyBearer(request).then((decoded) =>
        verifyScope(request, decoded, resolve, reject, scopes),
      );
    }

    const err = new InternalServerError("Invalid security name");
    request.authErrors?.push(err);
    return reject({});
  });
}

// Return the decoded token if successful, otherwise return null
export async function verifyOidc(
  request: express.Request,
): Promise<jwt.JwtPayload | null> {
  try {
    // https://www.better-auth.com/docs/integrations/express
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    // Check if the user is authenticated
    if (!session?.user) {
      const err = new AuthenticationError();
      request.authErrors?.push(err);
      return null;
    }

    // Get the decoded token from the user access token
    const decoded = await auth.api
      .getAccessToken({
        body: { providerId: "keycloak" },
        headers: fromNodeHeaders(request.headers),
      })
      .then((accessToken) => {
        return jwt.decode(accessToken.accessToken);
      });

    // Check if the decoded token is valid
    if (typeof decoded !== "object") {
      const err = new AuthenticationError();
      request.authErrors?.push(err);
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Authentication error:", error);
    const err = new AuthenticationError();
    request.authErrors?.push(err);
    return null;
  }
}

const client = jwksClient({ jwksUri: env.AUTH_JWKS_URI });
export function verifyBearer(
  request: express.Request,
): Promise<jwt.JwtPayload | null> {
  return new Promise((resolve) => {
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) {
      const err = new AuthenticationError();
      request.authErrors?.push(err);
      return resolve(null);
    }

    jwt.verify(
      token,
      (header, callback) => {
        client.getSigningKey(header.kid, (err, key) => {
          if (err || !key) {
            console.error("No key found for kid:", header.kid);
            const err = new AuthenticationError();
            request.authErrors?.push(err);
            return callback(err || new Error("No signing key"));
          }
          return callback(null, key.getPublicKey());
        });
      },
      { issuer: env.AUTH_ISSUER, audience: env.AUTH_CLIENT_ID },
      (error, decoded) => {
        // Check if the token is valid
        if (error) {
          console.error("Authentication error:", error.message);
          const err = new AuthenticationError();
          request.authErrors?.push(err);
          return resolve(null);
        }

        // Check if the token format is valid
        if (typeof decoded !== "object") {
          const err = new AuthenticationError();
          request.authErrors?.push(err);
          return resolve(null);
        }

        return resolve(decoded);
      },
    );
  });
}

const verifyScope = (
  request: express.Request,
  decoded: jwt.JwtPayload | null,
  resolve: (value: unknown) => void,
  reject: (value: unknown) => void,
  scopes?: string[],
) => {
  if (!decoded) {
    return reject({});
  }

  if (!hasAnyScope(decoded?.["groups"], scopes)) {
    request.authErrors?.push(
      new AuthorizationError(
        "Insufficient permissions to access this resource.",
      ),
    );
    return reject({});
  }

  request.authenticated = true;
  return resolve({});
};

// Verify if the groups contain ANY of the required scopes
const hasAnyScope = (groups?: string[], scopes?: string[]) => {
  // If no scopes are required, return true
  if (!scopes || scopes.length === 0) {
    return true;
  }

  // If no groups are present, return false
  if (!groups || groups.length === 0) {
    return false;
  }

  // Check if any of the groups contain any of the required scopes
  return groups.some((group) => scopes.includes(group));
};
