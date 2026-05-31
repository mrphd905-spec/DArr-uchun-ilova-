import { ApiError } from './error.js';

// Faqat ruxsat etilgan rollarga yo'l qo'yadi.
// Masalan: router.get('/', authRequired, requireRole('admin'), ...)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Bu amal faqat: ' + roles.join(', ')));
    }
    next();
  };
}

export const adminOnly = requireRole('admin');
