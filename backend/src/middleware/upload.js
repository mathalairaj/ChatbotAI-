import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';

fs.mkdirSync(env.uploadsDir, { recursive: true });

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/octet-stream', // Allowed only if extension is strictly in ALLOWED_EXTENSIONS
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(env.uploadsDir, { recursive: true });
    cb(null, env.uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.bin';
    cb(null, `${Date.now()}-${crypto.randomUUID()}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error('Unsupported file type. Only PDF, DOCX, TXT, and MD files are allowed.');
    err.statusCode = 400;
    return cb(err);
  }
  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const err = new Error(`Blocked MIME type: ${file.mimetype}`);
    err.statusCode = 400;
    return cb(err);
  }
  return cb(null, true);
}

export const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxUploadSizeMb * 1024 * 1024,
    files: 1,
  },
});
