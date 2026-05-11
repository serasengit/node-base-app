import { APICode, Language } from '@api-messages/api-messages';
import { BaseError } from '@api-messages/errors/base-error';
import { expect } from 'chai';
import { body } from 'express-validator';
import { afterEach, beforeEach, describe, it } from 'mocha';
import StatusCode from 'status-code-enum';
import { Container } from 'typedi';

import { NotFoundError } from '@api-messages/errors/not-found-error';
import logger from '@logger/logger';
import { Logger } from 'winston';
import { errorHandler, notFoundHandler, validateRequestParameters } from '../error-handler';

type TranslationCall = {
  code: string;
  language: Language;
};

type MockResponse = {
  statusCode?: number;
  body?: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

function createRequest(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    method: 'GET',
    originalUrl: '/test-route',
    headers: {},
    body: {},
    ...overrides
  };
}

function createResponse(): MockResponse {
  return {
    statusCode: undefined,
    body: undefined,
    status(code: number): MockResponse {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown): MockResponse {
      this.body = payload;
      return this;
    }
  };
}

describe('Error Handler Middleware', () => {
  const originalContainerGet = Container.get.bind(Container);
  const originalLoggerError = logger.error.bind(logger);
  const originalLoggerWarn = logger.warn.bind(logger);

  let translationCalls: TranslationCall[];

  beforeEach(() => {
    translationCalls = [];

    logger.error = (): Logger => logger;
    logger.warn = (): Logger => logger;

    Container.get = ((identifier: unknown) => {
      if (identifier) {
        return {
          findTranslationTextByCodeAndLanguage: async (code: string, language: Language = Language.Spanish): Promise<string> => {
            translationCalls.push({ code, language });
            return `translated:${language}:${code}`;
          }
        };
      }

      return originalContainerGet(identifier as never);
    }) as typeof Container.get;
  });

  afterEach(() => {
    Container.get = originalContainerGet as typeof Container.get;
    logger.error = originalLoggerError;
    logger.warn = originalLoggerWarn;
  });

  describe('validateRequestParameters', () => {
    it('should call next when validation succeeds', async () => {
      const req = createRequest({ body: { name: 'Meteo Test' } });
      let nextCalled = false;

      await body('name')
        .notEmpty()
        .withMessage('Name is required')
        .run(req as never);

      validateRequestParameters(req as never, {} as never, () => {
        nextCalled = true;
      });

      expect(nextCalled).to.equal(true);
    });

    it('should throw BaseError when validation fails', async () => {
      const req = createRequest({ body: { name: '' } });

      await body('name')
        .notEmpty()
        .withMessage('Name is required')
        .run(req as never);

      try {
        validateRequestParameters(req as never, {} as never, () => undefined);
        expect.fail('Expected validateRequestParameters to throw');
      } catch (error) {
        expect(error).to.be.instanceOf(BaseError);
        expect(error).to.have.property('code', APICode.ClientErrorUnprocessableEntity);
        expect(error).to.have.property('status', StatusCode.ClientErrorUnprocessableEntity);
        expect(error).to.have.nested.property('context.errors').that.deep.equals(['Name is required']);
      }
    });
  });

  describe('notFoundHandler', () => {
    it('should forward a BaseError with route details', () => {
      const req = createRequest({ method: 'POST', originalUrl: '/missing-route' });
      let forwardedError: unknown;

      notFoundHandler(req as never, {} as never, (error?: unknown) => {
        forwardedError = error;
      });

      expect(forwardedError).to.be.instanceOf(BaseError);
      expect(forwardedError).to.have.property('status', StatusCode.ClientErrorNotFound);
      expect(forwardedError).to.have.property('message', 'Route not found: POST /missing-route');
    });
  });

  describe('errorHandler', () => {
    it('should return translated malformed request errors', async () => {
      const req = createRequest({
        method: 'POST',
        originalUrl: '/meteo-stations',
        headers: { language: Language.English }
      });
      const res = createResponse();
      const error = Object.assign(new SyntaxError('Unexpected token { in JSON at position 1'), {
        status: StatusCode.ClientErrorBadRequest,
        type: 'entity.parse.failed'
      });

      await errorHandler(error, req as never, res as never, (() => undefined) as never);

      expect(res.statusCode).to.equal(StatusCode.ClientErrorBadRequest);
      expect(res.body).to.deep.equal({
        code: APICode.MalformedRequest,
        status: StatusCode.ClientErrorBadRequest,
        message: 'translated:en:malformed_request'
      });
      expect(translationCalls).to.deep.equal([
        { code: APICode.InternalServerError, language: Language.English },
        { code: APICode.MalformedRequest, language: Language.English }
      ]);
    });

    it('should return translated BaseError payloads with details and nested errors', async () => {
      const req = createRequest({
        method: 'PUT',
        originalUrl: '/meteo-stations/1',
        headers: { language: Language.English }
      });
      const res = createResponse();
      const error = new BaseError(APICode.MeteoStationAlreadyExists, StatusCode.ClientErrorConflict, {
        details: 'name must be unique',
        errors: [
          { code: APICode.RequiredParameter, message: 'name' },
          { code: APICode.InvalidParameter, message: '' }
        ]
      });

      await errorHandler(error, req as never, res as never, (() => undefined) as never);

      expect(res.statusCode).to.equal(StatusCode.ClientErrorConflict);
      expect(res.body).to.deep.equal({
        code: APICode.MeteoStationAlreadyExists,
        status: StatusCode.ClientErrorConflict,
        message: 'translated:en:meteo_station_already_exists: name must be unique',
        details: 'name must be unique',
        errors: [
          {
            code: APICode.RequiredParameter,
            message: 'translated:en:required_parameter: name'
          },
          {
            code: APICode.InvalidParameter,
            message: 'translated:en:invalid_parameter'
          }
        ]
      });
    });

    it('should return translated not found errors', async () => {
      const req = createRequest({ originalUrl: '/meteo-stations/999' });
      const res = createResponse();
      const error = new NotFoundError(APICode.MeteoStationNotFound, { details: 'stationId=999' });

      await errorHandler(error, req as never, res as never, (() => undefined) as never);

      expect(res.statusCode).to.equal(StatusCode.ClientErrorNotFound);
      expect(res.body).to.deep.equal({
        code: APICode.MeteoStationNotFound,
        status: StatusCode.ClientErrorNotFound,
        message: 'translated:es:meteo_station_not_found: stationId=999',
        details: 'stationId=999'
      });
    });

    it('should use spanish by default for unexpected errors', async () => {
      const req = createRequest();
      const res = createResponse();

      await errorHandler(new Error('Unexpected failure'), req as never, res as never, (() => undefined) as never);

      expect(res.statusCode).to.equal(StatusCode.ServerErrorInternal);
      expect(res.body).to.deep.equal({
        code: APICode.InternalServerError,
        status: StatusCode.ServerErrorInternal,
        message: 'translated:es:internal_server_error'
      });
      expect(translationCalls[0]).to.deep.equal({
        code: APICode.InternalServerError,
        language: Language.Spanish
      });
    });

    it('should return fallback json when the handler itself fails', async () => {
      Container.get = (() => {
        throw Object.assign(new Error('translation container unavailable'), {
          code: APICode.UnknownError,
          status: StatusCode.ServerErrorServiceUnavailable
        });
      }) as typeof Container.get;

      const req = createRequest();
      const res = createResponse();

      await errorHandler(new Error('Original error'), req as never, res as never, (() => undefined) as never);

      expect(res.statusCode).to.equal(StatusCode.ServerErrorServiceUnavailable);
      expect(res.body).to.deep.equal({
        code: APICode.UnknownError,
        status: StatusCode.ServerErrorServiceUnavailable,
        message: 'translation container unavailable'
      });
    });
  });
});
