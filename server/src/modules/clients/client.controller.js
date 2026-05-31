import { ClientService } from './client.service.js';
import { asyncHandler, ApiError } from '../../middlewares/error.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await ClientService.list(req.query)) });
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ ok: true, item: await ClientService.get(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, item: await ClientService.create(req.body, req.user) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ ok: true, item: await ClientService.update(req.params.id, req.body) });
});

export const checkTelegram = asyncHandler(async (req, res) => {
  const { handle } = req.body || {};
  if (!handle) throw ApiError.badRequest('handle kerak');
  res.json({ ok: true, item: await ClientService.checkTelegram(req.params.id, handle) });
});

export const toggleBlacklist = asyncHandler(async (req, res) => {
  res.json({ ok: true, item: await ClientService.toggleBlacklist(req.params.id, !!req.body.value) });
});

export const blacklist = asyncHandler(async (req, res) => {
  res.json({ ok: true, items: await ClientService.blacklist() });
});
