import chai from 'chai';
import chaiHttp, { request } from 'chai-http';
import app from '../../server';

chai.use(chaiHttp);

const { expect } = chai;

const AUTH_ENDPOINT = `/${process.env.SERVER_API}/auth`;

const TEST_SYSTEM_ADMIN_USERNAME = process.env.TEST_SYSTEM_ADMIN_USERNAME as string;

const TEST_SYSTEM_ADMIN_PASSWORD = process.env.TEST_SYSTEM_ADMIN_PASSWORD as string;

const TEST_READONLY_USERNAME = process.env.TEST_READONLY_USERNAME as string;

const TEST_READONLY_PASSWORD = process.env.TEST_READONLY_PASSWORD as string;

/**
 * Authenticates the seeded system administrator and returns a bearer token.
 */
export async function loginAsSystemAdmin(): Promise<string> {
  const response = await request.execute(app).post(AUTH_ENDPOINT).send({
    username: TEST_SYSTEM_ADMIN_USERNAME,
    password: TEST_SYSTEM_ADMIN_PASSWORD
  });

  expect(response).to.have.status(200);

  if (!response.body?.accessToken) {
    throw new Error('Expected an access token when authenticating the seeded system administrator.');
  }

  return response.body.accessToken as string;
}

/**
 * Authenticates the seeded read-only user and returns a bearer token.
 */
export async function loginAsReadOnly(): Promise<string> {
  const response = await request.execute(app).post(AUTH_ENDPOINT).send({
    username: TEST_READONLY_USERNAME,
    password: TEST_READONLY_PASSWORD
  });

  expect(response).to.have.status(200);

  if (!response.body?.accessToken) {
    throw new Error('Expected an access token when authenticating the seeded read-only user.');
  }

  return response.body.accessToken as string;
}

/**
 * Applies the Authorization bearer header to the provided request.
 */
export function withBearerToken(req: any, accessToken: string): any {
  return req.set('Authorization', `Bearer ${accessToken}`);
}
