import { Router } from 'express';
import * as ctrl from './client.controller.js';
import { authRequired } from '../../middlewares/auth.js';
import { adminOnly } from '../../middlewares/role.js';

const router = Router();
router.use(authRequired); // barcha endpointlar token talab qiladi

// Qora ro'yxat — faqat admin
router.get('/blacklist', adminOnly, ctrl.blacklist);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);                 // admin ham, gost ham kirita oladi
router.put('/:id', ctrl.update);               // yangilash
router.post('/:id/check-telegram', ctrl.checkTelegram);
router.post('/:id/blacklist', adminOnly, ctrl.toggleBlacklist); // faqat admin

export default router;
