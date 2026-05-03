import { APICode } from '@api-messages/api-messages';
import { DefaultSchemaKeys, Schema } from 'express-validator/lib/middlewares/schema';

export const paginationSchema = (orderFields: string[]): Schema<DefaultSchemaKeys> => ({
  limit: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: { code: APICode.InvalidParameter, message: 'limit' }
    },
    toInt: true
  },
  offset: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 0 },
      errorMessage: { code: APICode.InvalidParameter, message: 'offset' }
    },
    toInt: true
  },
  orderBy: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [orderFields],
      errorMessage: { code: APICode.InvalidParameter, message: 'orderBy' }
    }
  },
  order: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['asc', 'desc']],
      errorMessage: { code: APICode.InvalidParameter, message: 'order' }
    }
  }
});

export const findResourceSchema = (): Schema<DefaultSchemaKeys> => ({
  id: {
    in: ['params'],
    isInt: {
      options: { min: 1 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'id'
      }
    }
  }
});
