import { StatusCode } from 'status-code-enum';
import { BaseError } from './base-error';
import { APICode } from '@api-messages/api-messages';

/**
 * ForbiddenError error class
 */
export class ForbiddenError extends BaseError {
  constructor(code: APICode) {
    super(code, StatusCode.ClientErrorForbidden);
  }
}
