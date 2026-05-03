import { APICode } from '@api-messages/api-messages';
import StatusCode from 'status-code-enum';
import { BaseError } from './base-error';

/**
 * @summary UnauthorizedError
 * @description UnauthorizedError error class
 *
 */
export class UnauthorizedError extends BaseError {
  constructor(code: APICode) {
    super(code, StatusCode.ClientErrorUnauthorized);
  }
}
