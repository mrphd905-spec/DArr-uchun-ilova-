import { DeviceService } from './device.service.js';
import { asyncHandler } from '../../middlewares/error.js';

export const tree = asyncHandler(async (req, res) => {
  res.json({ ok: true, items: await DeviceService.tree() });
});
export const search = asyncHandler(async (req, res) => {
  res.json({ ok: true, items: await DeviceService.searchDevices(req.query.q) });
});
export const addCategory = asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, item: await DeviceService.addCategory(req.body) });
});
export const addGroup = asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, item: await DeviceService.addGroup(req.body) });
});
export const addDevice = asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, item: await DeviceService.addDevice(req.body) });
});
