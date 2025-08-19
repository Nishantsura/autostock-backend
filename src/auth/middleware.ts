import { NextFunction, Response } from 'express';
import { verifyJwt } from './strategies';
import { config } from '../config';
import { RequestWithUser } from '../types';

export function requireAuth(allowAnonymous: boolean = false) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!token) {
      if (allowAnonymous) return next();
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing Bearer token' } });
    }

    if (!config.JWT_SECRET) {
      return res.status(500).json({ error: { code: 'SERVER_CONFIG', message: 'JWT secret not configured' } });
    }

    try {
      const user = verifyJwt(token, config.JWT_SECRET);
      req.user = user;
      return next();
    } catch {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }
  };
}
