import { APICode } from '@api-messages/api-messages';
import { Schema } from 'express-validator/';
import { DefaultSchemaKeys } from 'express-validator/lib/middlewares/schema';

// Validation schema for entity
export const authSchema = (): Schema<DefaultSchemaKeys> => ({
  username: {
    in: ['body'],
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'username'
      }
    },
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'username'
      }
    },
    trim: true
  },
  password: {
    in: ['body'],
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'password'
      }
    },
    isLength: {
      options: { min: 1, max: 255 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'password'
      }
    },
    trim: true
  }
});
