import bcrypt from 'bcryptjs';
import { query } from '../../config/db.js';
import { signToken } from '../../utils/jwt.js';
import { ApiError } from '../../middlewares/error.js';

export class AuthService {
  // Login + parol -> token
  static async login(login, password) {
    const { rows } = await query(
      `SELECT id, name, login, pass_hash, role, active FROM workers WHERE login = $1`,
      [login]
    );
    const w = rows[0];
    if (!w || !w.active) throw ApiError.unauthorized('Login yoki parol xato');

    const ok = await bcrypt.compare(password, w.pass_hash);
    if (!ok) throw ApiError.unauthorized('Login yoki parol xato');

    const token = signToken({ id: w.id, role: w.role, name: w.name });
    return { token, user: { id: w.id, name: w.name, role: w.role } };
  }
}
