import { ReportService } from './report.service.js';
import { asyncHandler } from '../../middlewares/error.js';

export const summary = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await ReportService.summary(req.query)) });
});
