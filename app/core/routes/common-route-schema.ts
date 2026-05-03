import { APICode } from '@api-messages/api-messages';
import { DefaultSchemaKeys, Schema } from 'express-validator/lib/middlewares/schema';

/**
 * Builds a reusable pagination validation schema.
 *
 * Supports:
 * - limit: maximum number of records to return.
 * - offset: number of records to skip.
 * - orderBy: field used for sorting.
 * - order: sorting direction.
 */
export const paginationSchema = (orderFields: string[]): Schema<DefaultSchemaKeys> => ({
  limit: {
    in: ['query'],
    optional: true,

    // Limit must be an integer between 1 and 100.
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: { code: APICode.InvalidParameter, message: 'limit' }
    },

    // Convert validated input to number.
    toInt: true
  },

  offset: {
    in: ['query'],
    optional: true,

    // Offset must be a positive integer or zero.
    isInt: {
      options: { min: 0 },
      errorMessage: { code: APICode.InvalidParameter, message: 'offset' }
    },

    // Convert validated input to number.
    toInt: true
  },

  orderBy: {
    in: ['query'],
    optional: true,

    // Sorting field must be one of the allowed fields provided by the route.
    isIn: {
      options: [orderFields],
      errorMessage: { code: APICode.InvalidParameter, message: 'orderBy' }
    }
  },

  order: {
    in: ['query'],
    optional: true,

    // Sorting direction must be either ascending or descending.
    isIn: {
      options: [['asc', 'desc']],
      errorMessage: { code: APICode.InvalidParameter, message: 'order' }
    }
  }
});

/**
 * Validation schema for routes that receive a resource ID as a path parameter.
 */
export const findResourceSchema = (): Schema<DefaultSchemaKeys> => ({
  id: {
    in: ['params'],

    // Resource ID must be a positive integer.
    isInt: {
      options: { min: 1 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'id'
      }
    },

    // Convert validated input to number.
    toInt: true
  }
});
