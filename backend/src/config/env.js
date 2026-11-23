import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../..');

/**
 * Lightweight, dependency-free .env loader so backend works both with and without dotenv installed.
 */
function loadLocalEnv() {
  const envPath = path.join(BACKEND_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const toInt = (val, fallback) => {
  const parsed = Number.parseInt(val, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toFloat = (val, fallback) => {
  const parsed = Number.parseFloat(val);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  backendRoot: BACKEND_ROOT,
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 5000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  jwtSecret:
    process.env.JWT_SECRET ||
    'nscet-dev-only-jwt-secret-change-immediately-in-production-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  databaseUrl: (process.env.DATABASE_URL || '').trim(),
  dbSsl: process.env.DB_SSL === 'true',
  sqliteDbPath: path.resolve(
    BACKEND_ROOT,
    process.env.SQLITE_DB_PATH || './data/nscet_chatbot.db'
  ),

  openAiApiKey: (process.env.OPENAI_API_KEY || '').trim(),
  openAiBaseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
  openAiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  openAiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',

  ragChunkSize: toInt(process.env.RAG_CHUNK_SIZE, 900),
  ragChunkOverlap: toInt(process.env.RAG_CHUNK_OVERLAP, 180),
  ragTopK: toInt(process.env.RAG_TOP_K, 5),
  ragMinSimilarity: toFloat(process.env.RAG_MIN_SIMILARITY, 0.12),
  maxUploadSizeMb: toInt(process.env.MAX_UPLOAD_SIZE_MB, 15),

  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMaxRequests: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 180),
  chatRateLimitMax: toInt(process.env.CHAT_RATE_LIMIT_MAX, 40),
  authRateLimitMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 20),

  uploadsDir: path.join(BACKEND_ROOT, 'uploads'),
};

export const isOpenAiConfigured = () => Boolean(env.openAiApiKey && env.openAiApiKey.length > 10);
