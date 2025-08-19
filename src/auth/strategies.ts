import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { AuthUser } from '../types';

export function signJwt(
  payload: AuthUser,
  secret: string,
  expiresIn?: SignOptions['expiresIn']
): string {
  const options: SignOptions = {};
  if (typeof expiresIn !== 'undefined') {
    // jsonwebtoken v9 types require a specific StringValue/number union
    // Using a runtime guard and assignment keeps types happy
    (options as any).expiresIn = expiresIn as unknown as SignOptions['expiresIn'];
  }
  return jwt.sign(payload, secret as Secret, options);
}

export function verifyJwt(token: string, secret: string): AuthUser {
  const decoded = jwt.verify(token, secret as Secret);
  return decoded as AuthUser;
}
