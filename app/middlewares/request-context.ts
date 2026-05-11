import { AuthenticatedRequest } from '@core/types/authenticated-request';
import logger from '@logger/logger';
import { runWithRequestContext } from '@logger/request-context';
import { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Extracts a valid request ID from the incoming header.
 * If the header is missing, empty, or contains only whitespace, a new UUID is generated.
 */
const toRequestId = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value)?.trim() || crypto.randomUUID();

/**
 * Middleware that creates and propagates a request-scoped logging context.
 *
 * Responsibilities:
 * - Reads or generates a request ID.
 * - Stores the request ID in the request object.
 * - Adds the request ID to the response headers.
 * - Initializes the request context for downstream logging.
 * - Logs request completion time and final HTTP status code.
 */
export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = toRequestId(req.headers[REQUEST_ID_HEADER]);
  const startedAt = Date.now();

  // Make the request ID available to downstream handlers.
  (req as AuthenticatedRequest).requestId = requestId;

  // Return the request ID to the client for traceability.
  res.setHeader('X-Request-Id', requestId);

  // Run the rest of the request lifecycle within the request-scoped context.
  runWithRequestContext(
    {
      requestId,
      method: req.method,
      path: req.originalUrl
    },
    () => {
      // Log the request once the response has been fully sent.
      res.on('finish', () => {
        const durationMs = Date.now() - startedAt;

        logger.info(`${req.method} ${req.originalUrl} completed with status ${res.statusCode} in ${durationMs}ms`);
      });

      next();
    }
  );
};
