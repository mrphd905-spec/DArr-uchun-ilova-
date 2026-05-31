import { Router } from 'express';
import * as ctrl from './worker.controller.js';
import { authRequired } from '../../middlewares/auth.js';
import { adminOnly } from '../../middlewares/role.js';

const router = Router();
router.use(authRequired, adminOnly); // ishchilarni faqat admin boshqaradi

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
