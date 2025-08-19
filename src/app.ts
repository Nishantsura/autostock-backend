import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { companiesRouter } from './routes/companies';
import { productsRouter } from './routes/products';
import { usersRouter } from './routes/users';
import { storesRouter } from './routes/stores';
import { categoriesRouter } from './routes/categories';
import { skusRouter } from './routes/skus';
import { inventoryRouter } from './routes/inventory';
import { suppliersRouter } from './routes/suppliers';
import { purchaseOrdersRouter } from './routes/purchaseOrders';
import { auditRouter } from './routes/audit';
import { integrationsRouter } from './routes/integrations';
import { rackspaceRouter } from './routes/rackspace';
import { authRouter } from './routes/auth';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './db/prismaClient';

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (config.isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.'
      }
    }
  });
  app.use(limiter);

  const origin = config.CORS_ORIGINS && config.CORS_ORIGINS.length > 0 ? config.CORS_ORIGINS : true;
  app.use(cors({ origin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // Request logging and monitoring
  app.use((req, res, next) => {
    const startedAt = Date.now();
    const correlationId = (req.headers['x-correlation-id'] as string | undefined) || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add correlation ID to request for downstream logging
    (req as any).correlationId = correlationId;
    
    res.on('finish', () => {
      const duration = Date.now() - startedAt;
      const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      
      logger[logLevel]('http_request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: duration,
        correlationId,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        contentLength: res.get('Content-Length'),
      });
    });
    next();
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/ready', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.status(200).json({ ready: true });
    } catch (err) {
      logger.error('readiness_check_failed', { err: err instanceof Error ? err.message : String(err) });
      return res.status(500).json({ ready: false });
    }
  });

  // Advanced health check with detailed status
  app.get('/health/detailed', async (_req: Request, res: Response) => {
    const checks = {
      database: false,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '0.1.0',
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (err) {
      logger.warn('health_check_db_failed', { err: err instanceof Error ? err.message : String(err) });
    }

    const isHealthy = checks.database;
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
    });
  });

  // Serve OpenAPI documentation
  app.get('/api/docs', (_req: Request, res: Response) => {
    res.sendFile('/app/public/openapi.json', { root: process.cwd() });
  });

  app.get('/api/docs/json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile('/app/public/openapi.json', { root: process.cwd() });
  });

  app.use('/api/v1/companies', companiesRouter);
  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/stores', storesRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/skus', skusRouter);
  app.use('/api/v1', inventoryRouter);
  app.use('/api/v1/suppliers', suppliersRouter);
  app.use('/api/v1/purchase-orders', purchaseOrdersRouter);
  app.use('/api/v1', auditRouter);
  app.use('/api/v1/integrations', integrationsRouter);
  app.use('/api/v1/rackspace', rackspaceRouter);
  app.use('/api/v1/auth', authRouter);

  // 404 fallback
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
  });

  // Global error handling middleware
  app.use((err: any, req: Request, res: Response, _next: any) => {
    logger.error('unhandled_error', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      correlationId: req.headers['x-correlation-id'],
    });

    // Don't expose internal errors in production
    const message = config.isProduction ? 'Internal server error' : err.message;
    res.status(err.status || 500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message,
        ...(config.isProduction ? {} : { stack: err.stack }),
      },
    });
  });

  return app;
}
