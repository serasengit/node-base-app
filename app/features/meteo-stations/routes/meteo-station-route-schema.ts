import { APICode } from '@api-messages/api-messages';
import { Schema } from 'express-validator';
import { DefaultSchemaKeys } from 'express-validator/lib/middlewares/schema';

// Columns allowed for meteo station pagination and sorting.
export const meteoStationPaginationColumns = ['id', 'name', 'longitude', 'latitude', 'createdAt', 'updatedAt'];

/**
 * Validation schema for searching meteo stations.
 *
 * Supports an optional textSearch query parameter.
 */
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

/**
 * Validation schema for optional meteo station relations.
 *
 * The include query parameter supports comma-separated values, for example:
 * include=city
 */
export const meteoStationRelationSchema = (): Schema<DefaultSchemaKeys> => ({
  include: {
    in: ['query'],
    optional: true,

    // Normalize comma-separated strings into an array of relation names.
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

    // Ensure the normalized value is an array.
    isArray: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'include'
      }
    },

    // Validate that only supported relations can be requested.
    custom: {
      options: (value: string[]): boolean => {
        const allowedRelations = new Set(['city', 'createdBy', 'updatedBy']);

        return value.every((relation) => allowedRelations.has(relation));
      },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'include'
      }
    }
  }
});

/**
 * Validation schema for creating or updating a meteo station.
 */
export const meteoStationSchema = (): Schema<DefaultSchemaKeys> => ({
  name: {
    in: ['body'],

    // Station name must be a string.
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'name'
      }
    },

    // Station name is required and limited to 100 characters.
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'name'
      }
    },

    // Remove leading and trailing spaces.
    trim: true
  },

  longitude: {
    in: ['body'],

    // Longitude must be a valid decimal number between -180 and 180.
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

    // Convert validated input to number.
    toFloat: true
  },

  latitude: {
    in: ['body'],

    // Latitude must be a valid decimal number between -90 and 90.
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

    // Convert validated input to number.
    toFloat: true
  }
});
