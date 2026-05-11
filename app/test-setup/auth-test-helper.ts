import chai from 'chai';
import app from '../../server';

const AUTH_ENDPOINT = `/${process.env.SERVER_API}/auth`;

/**
 * Authenticates the seeded system administrator and returns a bearer token.
 */
export async function loginAsSystemAdmin(): Promise<string> {
  const response = await chai.request(app).post(AUTH_ENDPOINT).send({
    username: 'system_admin',
    password: 'Admin123!'
  });

  if (!response.body?.accessToken) {
    throw new Error('Expected an access token when authenticating the seeded system administrator.');
  }

  return response.body.accessToken as string;
}

/**
 * Applies the Authorization bearer header to the provided request.
 */
export function withBearerToken(request: any, accessToken: string): any {
  return request.set('Authorization', `Bearer ${accessToken}`);
}
