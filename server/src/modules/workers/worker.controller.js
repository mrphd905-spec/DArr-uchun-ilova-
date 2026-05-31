import { WorkerService } from './worker.service.js';
import { asyncHandler } from '../../middlewares/error.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ ok: true, items: await WorkerService.list() });
});
export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, item: await WorkerService.create(req.body) });
});
export const update = asyncHandler(async (req, res) => {
  res.json({ ok: true, item: await WorkerService.update(req.params.id, req.body) });
});
export const remove = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await WorkerService.remove(req.params.id)) });
});
