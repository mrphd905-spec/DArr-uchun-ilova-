// Markazlashgan xatolik boshqaruvi

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
  static badRequest(msg, details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Avtorizatsiya talab qilinadi') { return new ApiError(401, msg); }
  static forbidden(msg = 'Ruxsat yo\'q') { return new ApiError(403, msg); }
  static notFound(msg = 'Topilmadi') { return new ApiError(404, msg); }
}

export function notFound(req, res, next) {
  next(new ApiError(404, `Endpoint topilmadi: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    ok: false,
    error: err.message || 'Server xatosi',
    details: err.details,
  });
}

// async controller'larni try/catch'siz ishlatish uchun o'rovchi
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
