import { APICode } from '@api-messages/api-messages';
import StatusCode from 'status-code-enum';

export interface ValidationError {
  code: APICode;
  message: string;
}

export interface ErrorContext {
  details?: string;
  errors?: ValidationError[];
}

/**
 * Class defining the error object returned by the server.
 */
export class BaseError extends Error {
  code: APICode;
  status: StatusCode;
  context?: ErrorContext;

  constructor(code: APICode = APICode.InternalServerError, status: StatusCode = StatusCode.ServerErrorInternal, context?: ErrorContext) {
    super();
    Error.captureStackTrace(this, this.constructor);

    this.code = code;
    this.status = status;
    this.context = context;
  }
}
