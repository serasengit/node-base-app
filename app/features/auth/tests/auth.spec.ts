import { APICode, Language } from '@api-messages/api-messages';
import { UnauthorizedError } from '@api-messages/errors/unauthorized-error';
import { appConfig } from '@bootstrap/config';
import { getBearerTokenFromAuthHeader, toAccessTokenPayload, toRefreshTokenPayload } from '@features/auth/dtos/auth-dto';
import { RoleCode } from '@features/roles/schemas/role-schema';
import { resetRateLimitStore } from '@middlewares/rate-limit';
import chai, { expect } from 'chai';
import chaiHttp, { request } from 'chai-http';
import { afterEach, describe, it } from 'mocha';
import StatusCode from 'status-code-enum';
import app from '../../../../server';
import { withBearerToken } from '../../../test-setup/auth-test-helper';

chai.use(chaiHttp);

const AUTH_ENDPOINT = `/${process.env.SERVER_API}/auth`;
const CITIES_ENDPOINT = `/${process.env.SERVER_API}/cities`;
const TEST_SYSTEM_ADMIN_USERNAME = process.env.TEST_SYSTEM_ADMIN_USERNAME as string;
const TEST_SYSTEM_ADMIN_PASSWORD = process.env.TEST_SYSTEM_ADMIN_PASSWORD as string;
const TEST_READONLY_USERNAME = process.env.TEST_READONLY_USERNAME as string;
const TEST_READONLY_PASSWORD = process.env.TEST_READONLY_PASSWORD as string;

function uniqueCityName(suffix: string): string {
  return `AUTH_SPEC_CITY_${suffix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

const defaultAuthRateLimitWindowMs = appConfig.auth.rateLimitWindowMs;
const defaultAuthRateLimitMaxRequests = appConfig.auth.rateLimitMaxRequests;

async function login(username: string, password: string): Promise<string> {
  const response = await request.execute(app).post(AUTH_ENDPOINT).send({ username, password });

  expect(response).to.have.status(StatusCode.SuccessOK);
  expect(response.body).to.have.property('accessToken').that.is.a('string');

  return response.body.accessToken as string;
}

describe('Authentication API', function () {
  afterEach(() => {
    appConfig.auth.rateLimitWindowMs = defaultAuthRateLimitWindowMs;
    appConfig.auth.rateLimitMaxRequests = defaultAuthRateLimitMaxRequests;
    resetRateLimitStore();
  });

  describe('Auth DTO Helpers', () => {
    describe('getBearerTokenFromAuthHeader', () => {
      it('should return the bearer token from a valid authorization header', () => {
        const token = getBearerTokenFromAuthHeader('Bearer test-token');

        expect(token).to.equal('test-token');
      });

      it('should return the bearer token from the first authorization header value', () => {
        const token = getBearerTokenFromAuthHeader(['Bearer first-token', 'Bearer second-token']);

        expect(token).to.equal('first-token');
      });

      it('should throw RequiredToken when the authorization header is missing', () => {
        expect(() => getBearerTokenFromAuthHeader(undefined))
          .to.throw(UnauthorizedError)
          .that.includes({ code: APICode.RequiredToken });
      });

      it('should throw RequiredToken when the authorization scheme is invalid', () => {
        expect(() => getBearerTokenFromAuthHeader('Basic test-token'))
          .to.throw(UnauthorizedError)
          .that.includes({ code: APICode.RequiredToken });
      });

      it('should throw RequiredToken when the bearer token is missing', () => {
        expect(() => getBearerTokenFromAuthHeader('Bearer'))
          .to.throw(UnauthorizedError)
          .that.includes({ code: APICode.RequiredToken });
      });
    });

    describe('toAccessTokenPayload', () => {
      it('should return the normalized access token payload when claims are valid', () => {
        const payload = toAccessTokenPayload({
          userId: 1,
          roleCode: RoleCode.SystemAdministrator,
          language: Language.Spanish
        });

        expect(payload).to.include({
          userId: 1,
          roleCode: RoleCode.SystemAdministrator,
          language: Language.Spanish
        });
      });

      it('should throw InvalidAccessToken when the payload is a string', () => {
        expect(() => toAccessTokenPayload('invalid-payload'))
          .to.throw(UnauthorizedError)
          .that.includes({ code: APICode.InvalidAccessToken });
      });

      it('should throw InvalidAccessToken when userId is missing or invalid', () => {
        expect(() =>
          toAccessTokenPayload({
            roleCode: RoleCode.SystemAdministrator,
            language: Language.Spanish
          })
        )
          .to.throw(UnauthorizedError)
          .that.includes({ code: APICode.InvalidAccessToken });
      });

      it('should throw InvalidAccessToken when roleCode is missing or invalid', () => {
        expect(() =>
          toAccessTokenPayload({
            userId: 1,
            language: Language.Spanish
          })
        )
          .to.throw(UnauthorizedError)
          .that.includes({ code: APICode.InvalidAccessToken });
      });

      it('should throw InvalidAccessToken when language is missing or invalid', () => {
        expect(() =>
          toAccessTokenPayload({
            userId: 1,
            roleCode: RoleCode.SystemAdministrator
          })
        )
          .to.throw(UnauthorizedError)
          .that.includes({ code: APICode.InvalidAccessToken });
      });
    });

    describe('toRefreshTokenPayload', () => {
      it('should return the normalized refresh token payload when claims are valid', () => {
        const payload = toRefreshTokenPayload({
          userId: 1,
          type: 'refresh'
        });

        expect(payload).to.include({
          userId: 1,
          type: 'refresh'
        });
      });

      it('should throw InvalidRefreshToken when the payload is a string', () => {
        expect(() => toRefreshTokenPayload('invalid-payload'))
          .to.throw(UnauthorizedError)
          .that.includes({ code: APICode.InvalidRefreshToken });
      });

      it('should throw InvalidRefreshToken when userId is missing or invalid', () => {
        expect(() =>
          toRefreshTokenPayload({
            type: 'refresh'
          })
        )
          .to.throw(UnauthorizedError)
          .that.includes({ code: APICode.InvalidRefreshToken });
      });

      it('should throw InvalidRefreshToken when type is not refresh', () => {
        expect(() =>
          toRefreshTokenPayload({
            userId: 1,
            type: 'access'
          })
        )
          .to.throw(UnauthorizedError)
          .that.includes({ code: APICode.InvalidRefreshToken });
      });
    });
  });

  describe('POST /auth', () => {
    it('should authenticate the seeded system administrator', async () => {
      const response = await request.execute(app).post(AUTH_ENDPOINT).send({
        username: TEST_SYSTEM_ADMIN_USERNAME,
        password: TEST_SYSTEM_ADMIN_PASSWORD
      });

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('isAuthenticated', true);
      expect(response.body).to.have.property('accessToken').that.is.a('string');
      expect(response.body).to.have.property('permissions').that.is.an('array');
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.include({
        username: TEST_SYSTEM_ADMIN_USERNAME,
        language: 'es'
      });
      expect(response.body.user).to.not.have.property('password');
    });

    it('should reject invalid credentials', async () => {
      const response = await request.execute(app).post(AUTH_ENDPOINT).send({
        username: TEST_SYSTEM_ADMIN_USERNAME,
        password: 'wrong-password'
      });

      expect(response).to.have.status(StatusCode.ClientErrorForbidden);
      expect(response.body).to.have.property('code', APICode.InvalidPassword);
    });

    it('should rate limit repeated authentication attempts', async () => {
      appConfig.auth.rateLimitMaxRequests = 2;
      appConfig.auth.rateLimitWindowMs = 60000;
      resetRateLimitStore();

      await request.execute(app).post(AUTH_ENDPOINT).send({
        username: TEST_SYSTEM_ADMIN_USERNAME,
        password: 'wrong-password'
      });

      await request.execute(app).post(AUTH_ENDPOINT).send({
        username: TEST_SYSTEM_ADMIN_USERNAME,
        password: 'wrong-password'
      });

      const response = await request.execute(app).post(AUTH_ENDPOINT).send({
        username: TEST_SYSTEM_ADMIN_USERNAME,
        password: 'wrong-password'
      });

      expect(response).to.have.status(StatusCode.ClientErrorTooManyRequests);
      expect(response.body).to.have.property('code', APICode.TooManyRequests);
      expect(response).to.have.header('retry-after');
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should refresh the access token using the refresh token cookie', async () => {
      const agent = request.agent(app);

      const loginResponse = await agent.post(AUTH_ENDPOINT).send({
        username: TEST_SYSTEM_ADMIN_USERNAME,
        password: TEST_SYSTEM_ADMIN_PASSWORD
      });

      expect(loginResponse).to.have.status(StatusCode.SuccessOK);
      expect(loginResponse).to.have.cookie('refreshToken');

      const refreshResponse = await agent.post(`${AUTH_ENDPOINT}/refresh-token`);

      expect(refreshResponse).to.have.status(StatusCode.SuccessOK);
      expect(refreshResponse.body).to.have.property('accessToken').that.is.a('string');

      agent.close();
    });

    it('should rate limit repeated refresh attempts', async () => {
      appConfig.auth.rateLimitMaxRequests = 1;
      appConfig.auth.rateLimitWindowMs = 60000;
      resetRateLimitStore();

      const agent = request.agent(app);

      const loginResponse = await agent.post(AUTH_ENDPOINT).send({
        username: TEST_SYSTEM_ADMIN_USERNAME,
        password: TEST_SYSTEM_ADMIN_PASSWORD
      });

      expect(loginResponse).to.have.status(StatusCode.SuccessOK);
      resetRateLimitStore();

      const firstRefreshResponse = await agent.post(`${AUTH_ENDPOINT}/refresh-token`);
      expect(firstRefreshResponse).to.have.status(StatusCode.SuccessOK);

      const secondRefreshResponse = await agent.post(`${AUTH_ENDPOINT}/refresh-token`);
      expect(secondRefreshResponse).to.have.status(StatusCode.ClientErrorTooManyRequests);
      expect(secondRefreshResponse.body).to.have.property('code', APICode.TooManyRequests);

      agent.close();
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear the refresh token cookie and prevent further refresh attempts', async () => {
      const agent = request.agent(app);

      const loginResponse = await agent.post(AUTH_ENDPOINT).send({
        username: TEST_SYSTEM_ADMIN_USERNAME,
        password: TEST_SYSTEM_ADMIN_PASSWORD
      });

      expect(loginResponse).to.have.status(StatusCode.SuccessOK);
      expect(loginResponse).to.have.cookie('refreshToken');

      const logoutResponse = await agent.post(`${AUTH_ENDPOINT}/logout`);

      expect(logoutResponse).to.have.status(StatusCode.SuccessOK);
      expect(logoutResponse.headers).to.have.property('set-cookie');
      expect(logoutResponse.headers['set-cookie'][0]).to.include('refreshToken=');

      const refreshResponse = await agent.post(`${AUTH_ENDPOINT}/refresh-token`);

      expect(refreshResponse).to.have.status(StatusCode.ClientErrorUnauthorized);
      expect(refreshResponse.body).to.have.property('code', APICode.SessionExpired);

      agent.close();
    });
  });

  describe('Protected routes', () => {
    it('should reject requests without an access token', async () => {
      const response = await request.execute(app).get(CITIES_ENDPOINT);

      expect(response).to.have.status(StatusCode.ClientErrorUnauthorized);
      expect(response.body).to.have.property('code', APICode.RequiredToken);
    });

    it('should reject requests with an invalid access token', async () => {
      const response = await withBearerToken(request.execute(app).get(CITIES_ENDPOINT), 'invalid-token');

      expect(response).to.have.status(StatusCode.ClientErrorUnauthorized);
      expect(response.body).to.have.property('code', APICode.InvalidAccessToken);
    });

    it('should allow requests with a valid access token', async () => {
      const accessToken = await login(TEST_SYSTEM_ADMIN_USERNAME, TEST_SYSTEM_ADMIN_PASSWORD);
      const response = await withBearerToken(request.execute(app).get(CITIES_ENDPOINT), accessToken);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('records').that.is.an('array');
    });

    it('should allow read-only users to access routes with read grants', async () => {
      const accessToken = await login(TEST_READONLY_USERNAME, TEST_READONLY_PASSWORD);
      const response = await withBearerToken(request.execute(app).get(CITIES_ENDPOINT), accessToken);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('records').that.is.an('array');
    });

    it('should reject read-only users on routes without the required grants', async () => {
      const accessToken = await login(TEST_READONLY_USERNAME, TEST_READONLY_PASSWORD);
      const response = await withBearerToken(request.execute(app).post(CITIES_ENDPOINT), accessToken).send({
        name: uniqueCityName('FORBIDDEN'),
        province: 'Madrid',
        country: 'Spain'
      });

      expect(response).to.have.status(StatusCode.ClientErrorForbidden);
      expect(response.body).to.have.property('code', APICode.InvalidGrants);
    });
  });
});
