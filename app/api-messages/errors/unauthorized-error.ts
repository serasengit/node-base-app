import StatusCode from 'status-code-enum';
import { BaseError } from './base-error';
import { APICode, Language } from '@api-messages/api-messages';

/**
 * @summary UnauthorizedError
 * @description UnauthorizedError error class
 *
 */
export class UnauthorizedError extends BaseError {
  constructor(code: APICode, language?: Language) {
    super(code, StatusCode.ClientErrorUnauthorized, language);
  }
}
