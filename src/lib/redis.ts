import { createClient, RedisClientType } from 'redis';

import { env } from '../config/env';
import { logger } from './logger';

class RedisClient {
  private client?: RedisClientType;

  async initialize(): Promise<void> {
    this.client = await this.createClient();
  }

  async createClient() {
    const client = createClient({
      url: env.REDIS_PERSISTENT_URL,
      disableOfflineQueue: true,
    });

    client.on('error', (error) => logger.error('Error received from Redis.', { error }));

    await client.connect();

    return client as RedisClientType;
  }

  async keys(prefix: string) {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    return await this.client.keys(prefix);
  }

  async get(key: string) {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    return await this.client.get(key);
  }

  async set(key: string, value: string, expirationSeconds = 0) {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    if (expirationSeconds > 0) {
      await this.client.set(key, value, { EX: expirationSeconds });
      return;
    }

    await this.client.set(key, value);
  }

  async del(key: string) {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    await this.client.del(key);
  }

  async publish(channel: string, message: string) {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    await this.client.publish(channel, message);
  }

  // sadd: Add one or more members to a set
  async sadd(key: string, member: string) {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    await this.client.sAdd(key, member);
  }

  async srem(key: string, members: string[]) {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    await this.client.sRem(key, members);
  }

  async sismember(key: string, member: string) {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    return await this.client.sIsMember(key, member);
  }

  async smembers(key: string) {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    return await this.client.sMembers(key);
  }

  async quit() {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    await this.client.quit();
  }

  async getCachedOrFetch<T>(
    key: string,
    fn: () => Promise<T>,
    cacheDurationSeconds: number,
  ): Promise<T> {
    if (!this.client) {
      throw new Error('Client does not exist.');
    }

    try {
      const cachedValue = await this.client.get(key);
      if (cachedValue) {
        return JSON.parse(cachedValue) as T;
      }
    } catch (error) {
      logger.error(`Could not get '${key}' from Redis.`, { error });
    }

    const value = await fn();

    try {
      await this.client.set(key, JSON.stringify(value), { EX: cacheDurationSeconds });
    } catch (error) {
      logger.error(`Could not store '${key}' - '${value}' in Redis.`, { error });
    }

    return value;
  }
}

export const redisClient = new RedisClient();
