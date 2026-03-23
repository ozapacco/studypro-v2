import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

import sessionsRouter from './routes/sessions';
import reviewsRouter from './routes/reviews';
import dashboardRouter from './routes/dashboard';
import mockExamsRouter from './routes/mock-exams';
import statsRouter from './routes/stats';
import onboardingRouter from './routes/onboarding';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimiter({
  windowMs: 60000,
  maxRequests: 100,
}));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/sessions', sessionsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/mock-exams', mockExamsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/onboarding', onboardingRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'StudyPro API',
    version: '2.1.0',
    status: 'running',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[StudyPro] Server running on port ${PORT}`);
  console.log(`[StudyPro] Health check: http://localhost:${PORT}/health`);
  console.log(`[StudyPro] API: http://localhost:${PORT}/api`);
});

export default app;