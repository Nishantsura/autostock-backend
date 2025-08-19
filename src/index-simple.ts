import 'dotenv/config';
import http from 'http';
import { createSimpleApp } from './app-simple';
import { config } from './config';
import { logger } from './utils/logger';

function startSimpleServer(): http.Server {
  const app = createSimpleApp();
  const server = http.createServer(app);

  const port = config.PORT || 3000;
  
  server.listen(port, () => {
    logger.info('Simple server started', { port, env: config.NODE_ENV });
  });

  const shutdown = async (signal: string) => {
    logger.info('Shutting down', { signal });
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  return server;
}

// For Vercel
export default startSimpleServer;

// For local development
if (require.main === module) {
  startSimpleServer();
}
