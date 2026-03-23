import type { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RequestLog {
  count: number;
  resetTime: number;
}

const store = new Map<string, RequestLog>();

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60000,
  maxRequests: 100,
};

export function rateLimiter(config: RateLimitConfig = DEFAULT_CONFIG) {
  const { windowMs, maxRequests } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let log = store.get(key);

    if (!log || now > log.resetTime) {
      log = {
        count: 0,
        resetTime: now + windowMs,
      };
      store.set(key, log);
    }

    log.count++;

    if (log.count > maxRequests) {
      const retryAfter = Math.ceil((log.resetTime - now) / 1000);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter,
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - log.count));
    res.setHeader('X-RateLimit-Reset', new Date(log.resetTime).toISOString());

    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, log] of store.entries()) {
    if (now > log.resetTime) {
      store.delete(key);
    }
  }
}, 60000);

export function createRateLimiter(windowMs: number, maxRequests: number) {
  return rateLimiter({ windowMs, maxRequests });
}