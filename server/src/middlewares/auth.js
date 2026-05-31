import { verifyToken } from '../utils/jwt.js';
import { ApiError } from './error.js';

// Tokenni tekshirib, req.user ni to'ldiradi
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(ApiError.unauthorized());
  try {
    req.user = verifyToken(token); // { id, role, name }
    next();
  } catch {
    next(ApiError.unauthorized('Token yaroqsiz yoki muddati o\'tgan'));
  }
}
