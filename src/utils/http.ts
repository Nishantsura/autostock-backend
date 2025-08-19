import { Response } from 'express';
import { ZodError } from 'zod';

export function sendValidationError(
  res: Response,
  error: ZodError,
  message: string = 'Invalid request'
) {
  const details = error.flatten();
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message, details } });
}


