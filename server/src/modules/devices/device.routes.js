import { Router } from 'express';
import * as ctrl from './device.controller.js';
import { authRequired } from '../../middlewares/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', ctrl.tree);                 // to'liq daraxt
router.get('/search', ctrl.search);
router.post('/categories', ctrl.addCategory);
router.post('/groups', ctrl.addGroup);      // guruh — kategoriya tanlanadi
router.post('/', ctrl.addDevice);           // qurilma — kategoriya+guruh tanlanadi

export default router;
