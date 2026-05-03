import { APICode } from '@api-messages/api-messages';
import StatusCode from 'status-code-enum';
import { BaseError, ErrorContext } from './base-error';

/**
 * @summary ConflictError
 * @description ConflictError error class
 *
 */
export class ConflictError extends BaseError {
  constructor(code: APICode, context?: ErrorContext) {
    super(code, StatusCode.ClientErrorConflict, context);
  }
}
