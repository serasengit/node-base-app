import { APICode } from '@api-messages/api-messages';
import StatusCode from 'status-code-enum';
import { BaseError, ErrorContext } from './base-error';

/**
 * NotFoundError error class
 */
export class NotFoundError extends BaseError {
  constructor(code: APICode, context?: ErrorContext) {
    super(code, StatusCode.ClientErrorNotFound, context);
  }
}
