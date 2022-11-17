import { StatusCode } from 'status-code-enum';
import { BaseError } from './base-error';
import { APICode } from '@api-messages/api-messages';

/**
 * @summary NotImplementedMethodError
 * @description NotImplementedMethodError error class
 *
 */
export class NotImplementedMethodError extends BaseError {
  constructor() {
    super(APICode.ServerErrorNotImplemented, StatusCode.ServerErrorNotImplemented);
  }
}
