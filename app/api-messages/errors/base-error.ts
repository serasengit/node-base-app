import { APICode, getAPIMessage, Language } from '@api-messages/api-messages';
import { ValidationError } from 'express-validator';
import StatusCode from 'status-code-enum';

/**
 * @summary BaseError
 * @description Class where we define the error object returned by the server
 *
 */
export class BaseError extends Error {
  code: APICode;
  status: StatusCode;
  errors: ValidationError[];
  constructor(code: APICode, status: StatusCode, language: Language = Language.English, errors?: ValidationError[]) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.code = code || APICode.InternalServerError;
    this.message = code ? getAPIMessage(code, language) : getAPIMessage(APICode.InternalServerError, language);
    this.errors = errors;
    this.status = code ? status : StatusCode.ServerErrorInternal;
  }
}
