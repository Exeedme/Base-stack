import { NextFunction, Request, Response } from 'express';
import BenignError from '../errors/benign-error';
import { difference } from '../../helpers/functions';
import { platformRL } from './rate-limiters';
import { Permissions } from '../../enums/permissions';

/**
 * Middleware that populates the user object if the request is authenticated and rate limits requests.
 */
export function authentication(
  required: boolean,
  permissions = [] as Permissions[],
  extraAccess?: { apiKey?: boolean },
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (extraAccess && extraAccess.apiKey) {
      if (req.query.apiKey === process.env.EXTERNAL_ADMIN_API_KEY) {
        return next();
      }
    }
    try {
      const authInfo = await req.getAuthCookie();
      if (required) {
        if (authInfo.error) {
          throw authInfo.error;
        }

        if (
          permissions.length > 0 &&
          difference(permissions, authInfo.user.permissions).length === permissions.length
        ) {
          throw new BenignError('Access denied. Not enough permissions.');
        }
      }

      req._user = authInfo.user as any; // TODO: fix the type for null

      // Apply rate limiting
      platformRL(req, res, next);
    } catch (err) {
      res.clearAuthCookie();

      res.respondWithError('Access denied.', 401, err);
    }
  };
}
