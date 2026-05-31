import { Router } from 'express';
import * as ctrl from './report.controller.js';
import { authRequired } from '../../middlewares/auth.js';
import { adminOnly } from '../../middlewares/role.js';

const router = Router();
router.use(authRequired, adminOnly); // hisobot faqat admin uchun

router.get('/summary', ctrl.summary);

export default router;
