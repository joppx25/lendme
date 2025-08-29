import crypto from 'crypto';

export function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password.normalize(), salt, 64).toString('hex');
}

export function generateSalt(length: number = 16) {
  return crypto.randomBytes(length).toString('hex');
}

export function verifyPassword(password: string, hash: string, salt: string) {
  return hash === hashPassword(password, salt);
}