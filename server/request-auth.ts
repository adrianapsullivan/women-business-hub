import type { NextFunction, Request, Response } from "express";

import { getSupabaseClient } from "./supabase";

export interface VerifiedRequestUser {
  readonly id: string;
  readonly email: string | null;
}

export type AccessTokenVerifier = (
  token: string,
) => Promise<VerifiedRequestUser | null>;

export class RequestAuthenticationError extends Error {
  readonly statusCode = 401;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "RequestAuthenticationError";
  }
}

export interface AuthenticatedRequest extends Request {
  authenticatedUser: VerifiedRequestUser;
}

function readBearerToken(authorization: string | undefined): string {
  if (typeof authorization !== "string") {
    throw new RequestAuthenticationError();
  }

  const match = /^Bearer\s+(\S+)$/.exec(authorization);
  if (!match) {
    throw new RequestAuthenticationError();
  }

  return match[1];
}

export async function verifyAuthorizationHeader(
  authorization: string | undefined,
  verifyAccessToken: AccessTokenVerifier,
): Promise<VerifiedRequestUser> {
  const accessToken = readBearerToken(authorization);
  const user = await verifyAccessToken(accessToken);

  if (!user?.id) {
    throw new RequestAuthenticationError();
  }

  return Object.freeze({
    id: user.id,
    email: user.email ?? null,
  });
}

async function verifySupabaseAccessToken(
  accessToken: string,
): Promise<VerifiedRequestUser | null> {
  const { data, error } = await getSupabaseClient().auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
  };
}

export function createRequireSupabaseUser(
  verifyAccessToken: AccessTokenVerifier = verifySupabaseAccessToken,
) {
  return async function requireSupabaseUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authenticatedUser = await verifyAuthorizationHeader(
        req.header("authorization"),
        verifyAccessToken,
      );
      (req as AuthenticatedRequest).authenticatedUser = authenticatedUser;
      next();
    } catch (error) {
      if (error instanceof RequestAuthenticationError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      next(error);
    }
  };
}

export const requireSupabaseUser = createRequireSupabaseUser();

export function getAuthenticatedUser(req: Request): VerifiedRequestUser {
  const authenticatedUser = (req as Partial<AuthenticatedRequest>)
    .authenticatedUser;
  if (!authenticatedUser) {
    throw new RequestAuthenticationError();
  }
  return authenticatedUser;
}
