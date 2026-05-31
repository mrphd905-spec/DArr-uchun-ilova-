import { AuthService } from './auth.service.js';
import { asyncHandler, ApiError } from '../../middlewares/error.js';

export const login = asyncHandler(async (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) throw ApiError.badRequest('login va password kerak');
  const result = await AuthService.login(login, password);
  res.json({ ok: true, ...result });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ ok: true, user: req.user });
});
