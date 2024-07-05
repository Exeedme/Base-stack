import { NextFunction, Request, Response } from 'express';
import { createClient } from 'redis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { env } from '../../config/env';
import { EnvName } from '../../enums/environments';

const redisClient = createClient({
  url: env.REDIS_PERSISTENT_URL ?? '',
  disableOfflineQueue: false,
});

function getErrorMessage(msBeforeNext: number): string {
  return `Too many requests. Please try again in ${Math.ceil(msBeforeNext / 1000 / 60)} minutes.`;
}

// Rate limiter for authentication. Allows 8 authentications per hour per ip address
const authenticateRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 8,
  duration: 1 * 60 * 60,
  inMemoryBlockOnConsumed: 8,
  keyPrefix: 'authenticate',
});

export async function authenticateRL(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (env.NODE_ENV === EnvName.PRODUCTION) {
      await authenticateRateLimiter.consume(req.userIp);
    }

    next();
  } catch (err) {
    if (!err.msBeforeNext) {
      // Redis is down. Don't rate-limit anyone.
      next();
      return;
    }

    res.respondWithError(getErrorMessage(err.msBeforeNext), 429);
  }
}

// Rate limiter for forgot password. Allows 2 forgot passwords per hour per email address
const forgotPasswordRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 2,
  duration: 1 * 60 * 60,
  inMemoryBlockOnConsumed: 2,
  keyPrefix: 'forgotPassword',
});

export async function forgotPasswordRL(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.params.email) {
      res.respondWithError('Email was not provided.', 400);
      return;
    }

    if (env.NODE_ENV === EnvName.PRODUCTION) {
      await forgotPasswordRateLimiter.consume(req.params.email.toLowerCase());
    }

    next();
  } catch (err) {
    if (!err.msBeforeNext) {
      // Redis is down. Don't rate-limit anyone.
      next();
      return;
    }

    res.respondWithError(getErrorMessage(err.msBeforeNext), 429);
  }
}

// Rate limiter for password reset. Allows 2 password resets per hour per ip address
const resetPasswordRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 2,
  duration: 1 * 60 * 60,
  inMemoryBlockOnConsumed: 2,
  keyPrefix: 'resetPassword',
});

export async function resetPasswordRL(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (env.NODE_ENV === EnvName.PRODUCTION) {
      await resetPasswordRateLimiter.consume(req.userIp);
    }

    next();
  } catch (err) {
    if (!err.msBeforeNext) {
      // Redis is down. Don't rate-limit anyone.
      next();
      return;
    }

    res.respondWithError(getErrorMessage(err.msBeforeNext), 429);
  }
}

// Rate limiter for authenticated users. Allows 16 requests per second per authenticated user
const platformRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 16,
  duration: 1,
  inMemoryBlockOnConsumed: 16,
  keyPrefix: 'platform',
});

// Rate limiter for unauthenticated users. Allows 8 requests per second per ip address
const openPlatformRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 8,
  duration: 1,
  inMemoryBlockOnConsumed: 8,
  keyPrefix: 'openPlatform',
});

export async function platformRL(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (env.NODE_ENV === EnvName.PRODUCTION) {
      if (req._user) {
        await platformRateLimiter.consume(req._user.id);
      } else {
        await openPlatformRateLimiter.consume(req.userIp);
      }
    }

    next();
  } catch (err) {
    if (!err.msBeforeNext) {
      // Redis is down. Don't rate-limit anyone.
      next();
      return;
    }

    res.respondWithError(getErrorMessage(err.msBeforeNext), 429);
  }
}

