import { Router } from 'express';
import * as ctrl from './booking.controller.js';
import { authRequired } from '../../middlewares/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id/status', ctrl.setStatus); // tasdiqlash / bekor qilish

export default router;
