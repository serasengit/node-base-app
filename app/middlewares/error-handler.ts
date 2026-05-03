import { APICode } from '@api-messages/api-messages';
import { BaseError } from '@api-messages/errors/base-error';
import express, { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import StatusCode from 'status-code-enum';
import logger from '../logger/logger';

/**
 * Generic HTTP error used to propagate an explicit HTTP status code
 * through the Express error handling middleware.
 */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Express middleware that validates request parameters using express-validator.
 *
 * If validation errors are found, a BaseError is thrown with HTTP 422 status.
 * Otherwise, the request continues to the next middleware or controller.
 */
export function validateRequestParameters(req: express.Request, _res: express.Response, next: express.NextFunction): void {
  const result = validationResult(req);

  // Stop the request flow when validation errors exist.
  if (!result.isEmpty()) {
    throw new BaseError(APICode.ClientErrorUnprocessableEntity, StatusCode.ClientErrorUnprocessableEntity, {
      // Return only the validation messages to avoid exposing internal details.
      errors: result.array().map((error) => error.msg)
    });
  }

  // Continue to the next middleware when validation succeeds.
  next();
}

/**
 * Express middleware used as a fallback for unmatched routes.
 *
 * This should be registered after all application routes.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Global Express error handler.
 *
 * Converts application errors into a normalized JSON HTTP response and logs
 * the error context for troubleshooting.
 */
export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  void _next;
  const status = error instanceof BaseError ? error.status : error instanceof HttpError ? error.status : StatusCode.ServerErrorInternal;

  const details = error instanceof BaseError ? error.context : error instanceof HttpError ? error.details : undefined;

  const message = error instanceof BaseError ? error.code : error.message || 'Internal server error';

  // Log the request method, route and error message.
  logger.error(`Error in ${req.method} ${req.originalUrl}: ${message}`);

  // Return a consistent JSON error response to the client.
  res.status(status).json({
    status,
    message,
    ...(details ? { details } : {})
  });
}
