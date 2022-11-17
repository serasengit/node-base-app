import StatusCode from 'status-code-enum';
import { BaseError } from './base-error';
import { APICode } from '@api-messages/api-messages';

/**
 * @summary NotFoundError
 * @description NotFoundError error class
 *
 */
export class NotFoundError extends BaseError {
  constructor(code: APICode) {
    super(code, StatusCode.ClientErrorNotFound);
  }
}
