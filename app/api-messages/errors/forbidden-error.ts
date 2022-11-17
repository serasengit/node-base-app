import { StatusCode } from 'status-code-enum';
import { BaseError } from './base-error';
import { APICode, Language } from '@api-messages/api-messages';

/**
 * @summary ForbiddenError
 * @description ForbiddenError error class
 *
 */
export class ForbiddenError extends BaseError {
  constructor(code: APICode, language?: Language) {
    super(code, StatusCode.ClientErrorForbidden, language);
  }
}
