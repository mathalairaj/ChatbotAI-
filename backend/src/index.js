import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { env, isOpenAiConfigured } from './config/env.js';
import { getDb, initDatabase } from './db/index.js';
import { errorHandler, sanitizeRequestBody, securityHeaders } from './middleware/security.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import documentRoutes from './routes/documents.js';
import admissionRoutes from './routes/admissions.js';
import collegeRoutes from './routes/college.js';
import feedbackRoutes from './routes/feedback.js';
import adminRoutes from './routes/admin.js';

export async function createApp({ sqlitePath = null } = {}) {
  await initDatabase(sqlitePath);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const allowedOrigins = env.corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return cb(null, true);
        }
        return cb(null, false);
      },
      credentials: true,
    })
  );

  app.use(securityHeaders);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(sanitizeRequestBody);
  app.use('/api', generalRateLimiter);

  // Health & AI runtime status endpoint (exposes zero secrets)
  app.get('/api/health', (_req, res) => {
    const db = getDb();
    return res.json({
      status: 'ok',
      service: 'NSCET AI College Assistant API',
      institution: 'Nadar Saraswathi College of Engineering & Technology (NSCET), Vadapudupatti, Theni',
      databaseEngine: db.engine,
      aiMode: isOpenAiConfigured() ? 'openai' : 'local-rag-grounded',
      chatModel: isOpenAiConfigured() ? env.openAiChatModel : 'nscet-rag-grounded-local',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount REST API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/admissions', admissionRoutes);
  app.use('/api/college', collegeRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/admin', adminRoutes);

  // Serve built frontend bundle in production if present
  const frontendDist = path.resolve(env.backendRoot, '../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  } else {
    app.use('/api', (_req, res) => {
      res.status(404).json({ error: 'API endpoint not found.' });
    });
  }

  app.use(errorHandler);
  return app;
}

// Start server only when executed directly (not when imported by test runner)
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

if (isDirectRun) {
  createApp()
    .then((app) => {
      app.listen(env.port, () => {
        const db = getDb();
        console.log(`================================================================`);
        console.log(`  NSCET AI College Assistant Backend running on port ${env.port}`);
        console.log(`  Database Engine : ${db.engine}`);
        console.log(`  AI Engine Mode  : ${isOpenAiConfigured() ? `OpenAI (${env.openAiChatModel})` : 'Local Grounded RAG (Set OPENAI_API_KEY for live LLM)'}`);
        console.log(`================================================================`);
      });
    })
    .catch((err) => {
      console.error('Failed to start NSCET AI College Assistant backend:', err);
      process.exit(1);
    });
}
