import { Queue } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const buildQueue = new Queue('build-steps', {
  connection: redisOptions,
});
