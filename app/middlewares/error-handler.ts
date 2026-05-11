import { APICode, Language } from '@api-messages/api-messages';
import { BaseError } from '@api-messages/errors/base-error';
import express, { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import StatusCode from 'status-code-enum';
import { Container } from 'typedi';

import TranslationService from '@features/translations/services/translation-service';
import logger from '../logger/logger';

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
  const error = new BaseError(APICode.ClientErrorNotFound, StatusCode.ClientErrorNotFound);
  error.message = `Route not found: ${req.method} ${req.originalUrl}`;
  next(error);
}

/**
 * Global Express error handler.
 *
 * Converts application errors into a normalized JSON HTTP response,
 * translates known API codes, and logs the error context for troubleshooting.
 */
export async function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): Promise<void> {
  void _next;

  try {
    const translationService = Container.get(TranslationService);

    // Extract language from request headers. Spanish is used as default language.
    const language = (req.headers.language as Language) || Language.Spanish;

    // Default error response values.
    let code: APICode = APICode.InternalServerError;
    let status: number = StatusCode.ServerErrorInternal;
    let message = (await translationService.findTranslationTextByCodeAndLanguage(code, language)) || code;
    let details: unknown;
    let errors: unknown;

    const parseError = error as Error & {
      status?: number;
      type?: string;
      body?: unknown;
    };

    // Handle malformed JSON request bodies.
    if (
      parseError.type === 'entity.parse.failed' ||
      (error instanceof SyntaxError && parseError.status === StatusCode.ClientErrorBadRequest)
    ) {
      code = APICode.MalformedRequest;
      status = StatusCode.ClientErrorBadRequest;
      message = (await translationService.findTranslationTextByCodeAndLanguage(code, language)) || code;

      logger.error(`Error in ${req.method} ${req.originalUrl}: code: ${code}, message: ${error.message}, stack: ${error.stack}`);
    } else if (error instanceof BaseError) {
      // Handle controlled application errors.
      code = error.code ?? code;
      status = error.status;
      details = error.context?.details;

      message = (await translationService.findTranslationTextByCodeAndLanguage(code, language)) || code;

      if (details) {
        message += `: ${details}`;
      }

      // Translate nested validation/domain errors when available.
      if (error.context?.errors) {
        errors = await Promise.all(
          error.context.errors.map(async (subError) => {
            const subErrorMessage =
              (await translationService.findTranslationTextByCodeAndLanguage(subError.code, language)) || subError.code;

            return {
              ...subError,
              message: subError.message ? `${subErrorMessage}: ${subError.message}` : subErrorMessage
            };
          })
        );
      }

      logger.error(
        `Error in ${req.method} ${req.originalUrl}: code: ${code}, message: ${message}, details: ${JSON.stringify(
          details
        )}, errors: ${JSON.stringify(errors)}, stack: ${error.stack}`
      );
    } else {
      // Handle unexpected errors.
      logger.error(
        `Error in ${req.method} ${req.originalUrl}: code: ${code}, message: ${error.message}, stack: ${
          error instanceof Error ? error.stack : 'N/A'
        }`
      );
    }

    // Return a consistent JSON error response to the client.
    res.status(status).json({
      code,
      status,
      message,
      ...(details ? { details } : {}),
      ...(errors ? { errors } : {})
    });
  } catch (handlerError) {
    const fallbackError = handlerError as Error & {
      code?: APICode;
      status?: number;
      details?: unknown;
    };

    logger.error(
      `Error in errorHandler: code: ${fallbackError.code}, message: ${fallbackError.message}, details: ${JSON.stringify(
        fallbackError.details
      )}, stack: ${fallbackError.stack}`
    );

    res.status(fallbackError.status || StatusCode.ServerErrorInternal).json({
      code: fallbackError.code || APICode.InternalServerError,
      status: fallbackError.status || StatusCode.ServerErrorInternal,
      message: fallbackError.message || fallbackError.code || APICode.InternalServerError
    });
  }
}
