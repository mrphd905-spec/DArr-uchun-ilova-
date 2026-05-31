import { BookingService } from './booking.service.js';
import { asyncHandler } from '../../middlewares/error.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ ok: true, items: await BookingService.list(req.query.status) });
});
export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, item: await BookingService.create(req.body, 'admin') });
});
export const setStatus = asyncHandler(async (req, res) => {
  res.json({ ok: true, item: await BookingService.setStatus(req.params.id, req.body.status) });
});
