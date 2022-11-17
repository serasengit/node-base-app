import { APICode, Language } from '@api-messages/api-messages';
import { BaseError } from '@api-messages/errors/base-error';
import express from 'express';
import { validationResult } from 'express-validator';
import { StatusCode } from 'status-code-enum';
import { Service } from 'typedi';

@Service()
export class BaseController {
  /**
   * @summary ValidateRequest
   * @description Validate body request
   * @param req {object} Express req object
   *
   */
  validateRequest(req: express.Request): void {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BaseError(
        APICode.ClientErrorUnprocessableEntity,
        StatusCode.ClientErrorUnprocessableEntity,
        req.headers?.language as Language,
        errors.array().map((error) => error.msg)
      );
    }
  }
}
