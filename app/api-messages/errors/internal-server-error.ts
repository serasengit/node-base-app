import { APICode } from '@api-messages/api-messages';
import { StatusCode } from 'status-code-enum';
import { BaseError } from './base-error';

/**
 * @summary InternalServerError
 * @description InternalServerError error class
 *
 */
export class InternalServerError extends BaseError {
  constructor(code: APICode) {
    super(code, StatusCode.ServerErrorInternal);
  }
}
