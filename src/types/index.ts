import { Request } from 'express';

export interface AuthUser {
  userId: string;
  companyId: string;
  role: 'admin' | 'manager' | string;
  email?: string;
}

export interface RequestWithUser extends Request {
  user?: AuthUser;
}
