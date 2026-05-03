import { APICode } from '@api-messages/api-messages';
import { StatusCode } from 'status-code-enum';
import { BaseError, ErrorContext } from './base-error';

/**
 * @summary BadRequestError
 * @description BadRequestError error class
 *
 */
export class BadRequestError extends BaseError {
  constructor(code: APICode, context?: ErrorContext) {
    super(code, StatusCode.ClientErrorBadRequest, context);
  }
}
