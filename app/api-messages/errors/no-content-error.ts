import { APICode } from '@api-messages/api-messages';
import { StatusCode } from 'status-code-enum';
import { BaseError, ErrorContext } from './base-error';

/**
 * @summary NoContentError
 * @description NoContentError error class
 *
 */
export class NoContentError extends BaseError {
  constructor(code: APICode, context?: ErrorContext) {
    super(code, StatusCode.SuccessNoContent, context);
  }
}
