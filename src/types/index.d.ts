import '@total-typescript/ts-reset';

import { Permissions } from '../core/enums/permissions';
import { UtmData } from '../types/utm';
declare global {
  declare namespace Express {
    export interface Request {
      _user: {
        id: string;
        permissions: Permissions[];
        iat: number;
      };
      userIp: string;
      requestId: string;

      utm: Partial<UtmData>;

      getAuthCookie: () => Promise<
        | {
            user: { id: string; permissions: Permissions[]; iat: number };
            error: null;
          }
        | {
            user: null;
            error: Error;
          }
      >;
    }

    export interface Response {
      _error?: {
        message: string;
        userError: string;
        actualError?: unknown;
      };

      respondWithError: (message: string, statusCode: number, error?: unknown) => void;
      respondWithMessage: (message: string, statusCode?: number) => void;

      setAuthCookie: (userId: string, userPermissions: Permissions[]) => Promise<void>;
      clearAuthCookie: () => void;
    }
  }
}
