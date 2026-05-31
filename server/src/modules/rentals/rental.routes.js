import { Router } from 'express';
import * as ctrl from './rental.controller.js';
import { authRequired } from '../../middlewares/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', ctrl.listActive);        // faol ijaralar
router.post('/', ctrl.create);           // ijaraga berish
router.post('/:id/extend', ctrl.extend); // muddatni uzaytirish
router.post('/:id/accept', ctrl.accept); // qabul qilish (qaytarish)

export default router;
