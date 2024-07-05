import 'dotenv/config';
import { cleanEnv, str, num, EnvError, EnvMissingError } from 'envalid';
import { EnvName } from '../enums/environments';

// Check docs for more info about our envs: /docs/envs.md
export const env = cleanEnv(
  process.env,
  {
    COOKIE_SECRET: str(),
    REDIS_PERSISTENT_URL: str(),
    DATABASE_URL: str(),
    LOGDNA_KEY: str(),
    NODE_ENV: str({
      choices: [
        EnvName.DEVELOPMENT,
        EnvName.LOCAL,
        EnvName.PRODUCTION,
        EnvName.STAGING,
        EnvName.TEST,
      ],
      default: EnvName.DEVELOPMENT,
    }),
    PORT: num({ default: 8081 }),
  },
  {
    reporter: ({ errors }) => {
      for (const [envVar, err] of Object.entries(errors)) {
        if (err instanceof EnvError) {
          console.log(`Invalid env var ${envVar}: ${err.message}`);
          throw new Error(`Invalid env var ${envVar}: ${err.message}`);
        } else if (err instanceof EnvMissingError) {
          console.log(`Missing env var ${envVar}`);
          throw new Error(`Missing env var ${envVar}`);
        } else {
          console.log(`Unknown error for env var ${envVar}`);
        }
      }
    },
  },
);
