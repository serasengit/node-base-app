import { APICode, Language } from '@api-messages/api-messages';
import { UnauthorizedError } from '@api-messages/errors/unauthorized-error';
import { getBearerTokenFromAuthHeader, toAccessTokenPayload, toRefreshTokenPayload } from '@features/auth/dtos/auth-dto';
import { RoleCode } from '@features/roles/schemas/role-schema';
import { expect } from 'chai';
import { describe, it } from 'mocha';

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
