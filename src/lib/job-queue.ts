import { addSeconds } from 'date-fns';
import { Logger, makeWorkerUtils, parseCronItems, run, WorkerUtils } from 'graphile-worker';
import { Pool } from 'pg';
import { env } from '../config/env';
import { EnvName } from '../enums/environments';

const ssl = [EnvName.PRODUCTION, EnvName.STAGING].includes(env.NODE_ENV as EnvName)
  ? { rejectUnauthorized: false }
  : false;

class JobQueueClient {
  private workerUtils?: WorkerUtils;

  public async initialize() {
    this.workerUtils = await makeWorkerUtils({
      pgPool: new Pool({
        connectionString: env.DATABASE_URL,
        ssl,
        max: env.NODE_ENV === EnvName.STAGING ? 2 : 8,
      }),
    });
  }

  public async addJob(name: string, payload: Record<string, unknown>, delaySeconds?: number) {
    if (!this.workerUtils) {
      throw new Error('Worker utils are not initialized.');
    }

    const runAt = delaySeconds ? addSeconds(new Date(), delaySeconds) : undefined;

    await this.workerUtils.addJob(name, payload, {
      queueName: name,
      runAt,
    });
  }

  public async runJobsAndSetupCrons(
    jobs: Record<string, (payload: Record<string, any>) => Promise<void>>,
    crons: { task: string; match: string }[],
  ) {
    await run(
      {
        pgPool: new Pool({
          connectionString: env.DATABASE_URL,
          ssl,
          max: env.NODE_ENV === EnvName.STAGING ? 2 : 8,
        }),
        pollInterval: 5000,
        concurrency: 32,
        logger: new Logger(() => () => { }),
      },
      jobs as any,
      parseCronItems(crons.map((c) => ({ ...c, options: { queueName: c.task } as any }))),
    );
  }
}

export const jobQueueClient = new JobQueueClient();
