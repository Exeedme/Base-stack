import { NextFunction, Request, Response } from 'express';

import BenignError from '../errors/benign-error';
import { logger, redisClient } from '../../lib';
import { Permissions } from '../../enums/permissions';

const AUTH_COOKIE_NAME = 'app-token';

/**
 * Middleware that adds methods for responses.
 * @param _req
 * @param res
 * @param next
 */
export default function (req: Request, res: Response, next: NextFunction): void {
  req.getAuthCookie = async () => {
    const cookie = req.signedCookies?.[AUTH_COOKIE_NAME];
    if (!cookie) {
      return { user: null, error: new BenignError('Access denied. No cookie provided.') };
    }

    const decoded = JSON.parse(cookie) as { id: string; permissions: Permissions[]; iat: number };
    const isKnown = await redisClient.sismember(`auth:${decoded.id}`, `${decoded.iat}`);
    if (!isKnown) {
      return { user: null, error: new BenignError('Access denied. Cookie is no longer valid.') };
    }

    return { user: decoded, error: null };
  };

  res.setAuthCookie = async (userId, userPermissions) => {
    const iat = Math.floor(Date.now() / 1000);
    await redisClient.sadd(`auth:${userId}`, `${iat}`);
    console.log(userPermissions)
    res.cookie(
      AUTH_COOKIE_NAME,
      JSON.stringify({ id: userId, permissions: userPermissions, iat }),
      {
        httpOnly: true,
        path: '/',
        signed: true,
        sameSite: 'none',
        secure: true,
        maxAge: 3 * 24 * 60 * 60 * 1000,
      },
    );
  };

  res.clearAuthCookie = () => {
    res.clearCookie(AUTH_COOKIE_NAME);
  };

  res.respondWithError = (message, statusCode, error) => {
    let userError = message;

    if (error) {
      if (error instanceof BenignError) {
        userError = error.message;
        logger.warn(`[WARNING ERROR] ${req._user?.id} | ${req.requestId} | ${message}`, { error });
      } else {
        logger.error(`${req._user?.id} | ${req.requestId} | ${message}`, { error });
      }
    }

    res._error = {
      message,
      userError,
      actualError: error,
    };

    res.status(statusCode).json({ error: userError });
  };

  res.respondWithMessage = (message, statusCode) => {
    res.status(statusCode ?? 200).json({ message });
  };

  next();
}
