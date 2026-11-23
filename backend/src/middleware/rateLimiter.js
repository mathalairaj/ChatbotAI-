import { env } from '../config/env.js';
import { getClientIp } from './security.js';

/**
 * In-memory sliding-window rate limiter factory.
 * Suitable for single-instance Express deployments; swap store with Redis for multi-node clusters.
 */
export function createRateLimiter({ windowMs = env.rateLimitWindowMs, max = env.rateLimitMaxRequests, name = 'api' } = {}) {
  const hits = new Map();

  // Periodic cleanup of expired buckets to prevent memory growth
  const timer = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of hits.entries()) {
      const fresh = timestamps.filter((ts) => ts > cutoff);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }, Math.max(windowMs, 30000));
  if (typeof timer.unref === 'function') timer.unref();

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-bypass-ratelimit'] === 'true') {
      return next();
    }

    const ip = getClientIp(req);
    const key = `${name}:${ip}`;
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = (hits.get(key) || []).filter((ts) => ts > cutoff);

    if (recent.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
      });
    }

    recent.push(now);
    hits.set(key, recent);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - recent.length));
    return next();
  };
}

export const generalRateLimiter = createRateLimiter({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
  name: 'general',
});

export const authRateLimiter = createRateLimiter({
  windowMs: env.rateLimitWindowMs,
  max: env.authRateLimitMax,
  name: 'auth',
});

export const chatRateLimiter = createRateLimiter({
  windowMs: env.rateLimitWindowMs,
  max: env.chatRateLimitMax,
  name: 'chat',
});
