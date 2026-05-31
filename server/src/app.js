import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middlewares/error.js';

// Modul routerlari (har bir "sahifa" alohida modul)
import authRoutes from './modules/auth/auth.routes.js';
import clientRoutes from './modules/clients/client.routes.js';
import deviceRoutes from './modules/devices/device.routes.js';
import rentalRoutes from './modules/rentals/rental.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import workerRoutes from './modules/workers/worker.routes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigins.includes('*') ? true : env.corsOrigins }));
  app.use(express.json({ limit: '5mb' })); // rasm (base64) uchun limit

  // Sog'lik tekshiruvi
  app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

  // API v1
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/clients', clientRoutes);
  app.use('/api/v1/devices', deviceRoutes);
  app.use('/api/v1/rentals', rentalRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/workers', workerRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
