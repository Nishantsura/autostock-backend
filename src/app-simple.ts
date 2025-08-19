import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';

export function createSimpleApp(): Application {
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

  // Request logging
  app.use((req, res, next) => {
    const startedAt = Date.now();
    const correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
      });
    });
    next();
  });

  // Health endpoints
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/ready', (_req: Request, res: Response) => {
    res.status(200).json({ ready: true, environment: config.NODE_ENV });
  });

  app.get('/api/v1/status', (_req: Request, res: Response) => {
    res.status(200).json({
      service: 'autostock-backend',
      version: '0.1.0',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Test endpoint for frontend connection
  app.get('/api/v1/test', (_req: Request, res: Response) => {
    res.status(200).json({
      message: 'Backend is working!',
      cors: 'enabled',
      timestamp: new Date().toISOString()
    });
  });

  // 404 fallback
  app.use((req: Request, res: Response) => {
    res.status(404).json({ 
      error: { 
        code: 'NOT_FOUND', 
        message: `Route ${req.method} ${req.path} not found` 
      } 
    });
  });

  // Global error handling
  app.use((err: any, req: Request, res: Response, _next: any) => {
    logger.error('unhandled_error', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });

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
