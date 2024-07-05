import bcrypt from 'bcrypt';
import { redisClient } from '../lib';


const SALT_ROUNDS = 10; // Recomendado entre 10 e 12 para um bom equilíbrio

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  export async function invalidateToken(userId: string, iat: string): Promise<void> {
    await redisClient.srem(`auth:${userId}`, [iat]);
  }