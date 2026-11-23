/**
 * Security middleware: HTTP security headers, input sanitization, validation helpers, and global error handler.
 */

export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"
  );
  next();
}

export function stripDangerousMarkup(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\u0000/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

function sanitizeRecursive(input) {
  if (typeof input === 'string') return stripDangerousMarkup(input);
  if (Array.isArray(input)) return input.map(sanitizeRecursive);
  if (input && typeof input === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(input)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      clean[k] = sanitizeRecursive(v);
    }
    return clean;
  }
  return input;
}

export function sanitizeRequestBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeRecursive(req.body);
  }
  next();
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidPhone(phone) {
  return typeof phone === 'string' && /^[+\d][\d\s-]{7,18}$/.test(phone.trim());
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function errorHandler(err, _req, res, _next) {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Uploaded file exceeds the maximum allowed size limit.',
    });
  }
  if (err?.name === 'MulterError' || err?.statusCode === 400) {
    return res.status(400).json({ error: err.message || 'Invalid request.' });
  }
  const status = err?.status || err?.statusCode || 500;
  const message =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : err?.message || 'An unexpected error occurred.';
  if (status >= 500) {
    console.error('[NSCET API Error]', err);
  }
  return res.status(status).json({ error: message });
}
