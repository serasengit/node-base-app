import { APICode } from '@api-messages/api-messages';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { describe, it } from 'mocha';
import StatusCode from 'status-code-enum';
import app from '../../../../server';
import { withBearerToken } from '../../../test-setup/auth-test-helper';

chai.use(chaiHttp);

const AUTH_ENDPOINT = `/${process.env.SERVER_API}/auth`;
const CITIES_ENDPOINT = `/${process.env.SERVER_API}/cities`;

function uniqueCityName(suffix: string): string {
  return `AUTH_SPEC_CITY_${suffix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function login(username: string, password: string): Promise<string> {
  const response = await chai.request(app).post(AUTH_ENDPOINT).send({ username, password });

  expect(response).to.have.status(StatusCode.SuccessOK);
  expect(response.body).to.have.property('accessToken').that.is.a('string');

  return response.body.accessToken as string;
}

describe('Authentication API', function () {
  describe('POST /auth', () => {
    it('should authenticate the seeded system administrator', async () => {
      const response = await chai.request(app).post(AUTH_ENDPOINT).send({
        username: 'system_admin',
        password: 'Admin123!'
      });

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('isAuthenticated', true);
      expect(response.body).to.have.property('accessToken').that.is.a('string');
      expect(response.body).to.have.property('permissions').that.is.an('array');
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.include({
        username: 'system_admin',
        language: 'es'
      });
      expect(response.body.user).to.not.have.property('password');
    });

    it('should reject invalid credentials', async () => {
      const response = await chai.request(app).post(AUTH_ENDPOINT).send({
        username: 'system_admin',
        password: 'wrong-password'
      });

      expect(response).to.have.status(StatusCode.ClientErrorForbidden);
      expect(response.body).to.have.property('code', APICode.InvalidPassword);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should refresh the access token using the refresh token cookie', async () => {
      const agent = chai.request.agent(app);

      const loginResponse = await agent.post(AUTH_ENDPOINT).send({
        username: 'system_admin',
        password: 'Admin123!'
      });

      expect(loginResponse).to.have.status(StatusCode.SuccessOK);
      expect(loginResponse).to.have.cookie('refreshToken');

      const refreshResponse = await agent.post(`${AUTH_ENDPOINT}/refresh-token`);

      expect(refreshResponse).to.have.status(StatusCode.SuccessOK);
      expect(refreshResponse.body).to.have.property('accessToken').that.is.a('string');

      agent.close();
    });
  });

  describe('Protected routes', () => {
    it('should reject requests without an access token', async () => {
      const response = await chai.request(app).get(CITIES_ENDPOINT);

      expect(response).to.have.status(StatusCode.ClientErrorUnauthorized);
      expect(response.body).to.have.property('code', APICode.RequiredToken);
    });

    it('should reject requests with an invalid access token', async () => {
      const response = await withBearerToken(chai.request(app).get(CITIES_ENDPOINT), 'invalid-token');

      expect(response).to.have.status(StatusCode.ClientErrorUnauthorized);
      expect(response.body).to.have.property('code', APICode.InvalidAccessToken);
    });

    it('should allow requests with a valid access token', async () => {
      const accessToken = await login('system_admin', 'Admin123!');
      const response = await withBearerToken(chai.request(app).get(CITIES_ENDPOINT), accessToken);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('records').that.is.an('array');
    });

    it('should allow read-only users to access routes with read grants', async () => {
      const accessToken = await login('readonly', 'Readonly123!');
      const response = await withBearerToken(chai.request(app).get(CITIES_ENDPOINT), accessToken);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('records').that.is.an('array');
    });

    it('should reject read-only users on routes without the required grants', async () => {
      const accessToken = await login('readonly', 'Readonly123!');
      const response = await withBearerToken(chai.request(app).post(CITIES_ENDPOINT), accessToken).send({
        name: uniqueCityName('FORBIDDEN'),
        province: 'Madrid',
        country: 'Spain'
      });

      expect(response).to.have.status(StatusCode.ClientErrorForbidden);
      expect(response.body).to.have.property('code', APICode.InvalidGrants);
    });
  });
});
