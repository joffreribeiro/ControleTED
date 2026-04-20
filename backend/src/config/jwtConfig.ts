import jwt from 'jsonwebtoken';
import { JWT_SECRET_DEFAULT, JWT_EXPIRES_IN_DEFAULT } from './constants';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não definido');
  return secret;
}

export function getJwtExpiresIn(): jwt.SignOptions['expiresIn'] {
  return (process.env.JWT_EXPIRES_IN || JWT_EXPIRES_IN_DEFAULT) as jwt.SignOptions['expiresIn'];
}
