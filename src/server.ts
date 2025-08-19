import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './db/prismaClient';

export function startServer(): http.Server {
  const app = createApp();
  const server = http.createServer(app);

  server.listen(config.PORT, () => {
    logger.info('Server started', { port: config.PORT, env: config.NODE_ENV });
  });

  const shutdown = async (signal: string) => {
    logger.info('Shutting down', { signal });
    server.close(async () => {
      try {
        await prisma.$disconnect();
      } catch (err) {
        logger.error('Error during Prisma disconnect', { err: err instanceof Error ? err.message : String(err) });
      } finally {
        process.exit(0);
      }
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  return server;
}
