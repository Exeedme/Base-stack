import { createLogger, Logger } from '@logdna/logger';
import { env } from '../config/env';

class LoggerClient {
  private logger?: Logger;

  constructor() {
    if (env.LOGDNA_KEY) {
      this.logger = createLogger(env.LOGDNA_KEY, {
        app: 'stack-api',
        env: env.NODE_ENV,
        indexMeta: false,
      });

      this.logger.on('error', (_) => {
        // console.log(`[LOGGER ERROR]: ${err}`);
      });
    }
  }

  public debug(message: string, metadata = {}): void {
    console.log(`[DEBUG] ${message} - ${JSON.stringify(metadata)}`);

    this.logger?.debug?.(message, { meta: metadata });
  }

  public error(message: string, metadata = {}): void {
    console.log(`[ERROR] ${message} - ${JSON.stringify(metadata)}`);

    this.logger?.error?.(message, { meta: metadata });
  }

  public info(message: string, metadata = {}): void {
    console.log(`[INFO] ${message} - ${JSON.stringify(metadata)}`);

    this.logger?.info?.(message, { meta: metadata });
  }

  public warn(message: string, metadata = {}): void {
    console.log(`[WARN] ${message} - ${JSON.stringify(metadata)}`);

    this.logger?.warn?.(message, { meta: metadata });
  }

  public flush(): void {
    this.logger?.flush();
  }
}

export const logger = new LoggerClient();
export const loggerWorker = new LoggerClient();
export default new LoggerClient();