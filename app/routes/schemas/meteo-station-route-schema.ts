import { APICode } from '@api-messages/api-messages';
import { Schema } from 'express-validator';
import { DefaultSchemaKeys } from 'express-validator/lib/middlewares/schema';

export const meteoStationPaginationColumns = ['id', 'name', 'longitude', 'latitude', 'createdAt', 'updatedAt'];

export const findMeteoStationsSchema = (): Schema<DefaultSchemaKeys> => ({
  textSearch: {
    in: ['query'],
    optional: true,
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'textSearch'
      }
    },
    trim: true
  }
});

export const meteoStationRelationSchema = (): Schema<DefaultSchemaKeys> => ({
  include: {
    in: ['query'],
    optional: true,
    customSanitizer: {
      options: (value): string[] => {
        if (typeof value === 'string') {
          return value
            .split(',')
            .map((relation) => relation.trim())
            .filter(Boolean);
        }

        return Array.isArray(value) ? value : [];
      }
    },
    isArray: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'include'
      }
    },
    custom: {
      options: (value: string[]): boolean => {
        const allowedRelations = new Set(['createdBy', 'updatedBy']);

        return value.every((relation) => allowedRelations.has(relation));
      },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'include'
      }
    }
  }
});

export const meteoStationSchema = (): Schema<DefaultSchemaKeys> => ({
  name: {
    in: ['body'],
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'name'
      }
    },
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'name'
      }
    },
    trim: true
  },
  longitude: {
    in: ['body'],
    isFloat: {
      options: {
        min: -180,
        max: 180
      },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'longitude'
      }
    },
    toFloat: true
  },
  latitude: {
    in: ['body'],
    isFloat: {
      options: {
        min: -90,
        max: 90
      },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'latitude'
      }
    },
    toFloat: true
  }
});
