import { RentalService } from './rental.service.js';
import { asyncHandler } from '../../middlewares/error.js';

export const listActive = asyncHandler(async (req, res) => {
  res.json({ ok: true, items: await RentalService.listActive() });
});
export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, item: await RentalService.create(req.body, req.user) });
});
export const extend = asyncHandler(async (req, res) => {
  res.json({ ok: true, item: await RentalService.extend(req.params.id, req.body.days) });
});
export const accept = asyncHandler(async (req, res) => {
  res.json({ ok: true, result: await RentalService.accept(req.params.id, req.body) });
});
