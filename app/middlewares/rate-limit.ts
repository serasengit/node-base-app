import { APICode } from '@api-messages/api-messages';
import { BaseError } from '@api-messages/errors/base-error';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import StatusCode from 'status-code-enum';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  maxRequests: number | (() => number);
  windowMs: number | (() => number);
  keyGenerator?: (req: Request) => string;
};

/*
 * In-memory rate limit store.
 *
 * This is suitable for local development, tests, and single-instance deployments.
 * It is not shared across processes, containers, or horizontally scaled replicas.
 * For production workloads with multiple instances, use a shared backend such as
 * Redis or enforce rate limits at the gateway/WAF layer as well.
 */
const rateLimitStore = new Map<string, RateLimitBucket>();

const resolveValue = (value: number | (() => number)): number => (typeof value === 'function' ? value() : value);

/*
 * Default key includes method, route path, and client IP.
 *
 * This keeps limits scoped per endpoint and client address. Make sure Express
 * trust proxy is configured correctly when running behind a reverse proxy;
 * otherwise req.ip may represent the proxy instead of the original client.
 */
const defaultKeyGenerator = (req: Request): string => `${req.method}:${req.baseUrl}${req.path}:${req.ip}`;

/*
 * Clears the in-memory store.
 *
 * Intended for tests to avoid rate limit state leaking between test cases.
 * Avoid exposing this in runtime application code.
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

export function createRateLimitMiddleware(options: RateLimitOptions): RequestHandler {
  const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;

  return (req: Request, res: Response, next: NextFunction): void => {
    const maxRequests = resolveValue(options.maxRequests);
    const windowMs = resolveValue(options.windowMs);

    /*
     * A non-positive value disables the limiter.
     *
     * This allows feature-flagging the limiter through configuration, but should
     * be used carefully in production.
     */
    if (maxRequests <= 0 || windowMs <= 0) {
      return next();
    }

    const now = Date.now();
    const key = keyGenerator(req);
    const existingBucket = rateLimitStore.get(key);

    /*
     * Create a new fixed-window bucket when the key is first seen or when the
     * previous window has expired.
     */
    if (!existingBucket || existingBucket.resetAt <= now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs
      });

      return next();
    }

    /*
     * Reject requests once the bucket has reached the configured limit.
     *
     * Retry-After tells clients how long to wait before retrying.
     */
    if (existingBucket.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existingBucket.resetAt - now) / 1000));

      res.setHeader('Retry-After', retryAfterSeconds.toString());

      return next(new BaseError(APICode.TooManyRequests, StatusCode.ClientErrorTooManyRequests));
    }

    existingBucket.count += 1;
    rateLimitStore.set(key, existingBucket);

    return next();
  };
}
