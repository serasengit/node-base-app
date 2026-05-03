import { APICode } from '@api-messages/api-messages';
import { meteoStationSchema } from '@features/meteo-stations/routes/meteo-station-route-schema';
import { Schema } from 'express-validator';
import { DefaultSchemaKeys } from 'express-validator/lib/middlewares/schema';

// Columns allowed for city pagination and sorting.
export const cityPaginationColumns = ['id', 'name', 'province', 'country', 'createdAt', 'updatedAt'];

/**
 * Validation schema for searching cities.
 *
 * Supports an optional textSearch query parameter.
 */
export const findCitiesSchema = (): Schema<DefaultSchemaKeys> => ({
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
 * Validation schema for optional city relations.
 *
 * The include query parameter supports comma-separated values, for example:
 * include=meteoStations
 */
export const cityRelationSchema = (): Schema<DefaultSchemaKeys> => ({
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
        const allowedRelations = new Set(['meteoStations']);

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
 * Validation schema for nested meteo stations inside city create/update payloads.
 *
 * Nested records are validated under the `meteoStations.*` path.
 */
const meteoStationsSchema = (): Schema<DefaultSchemaKeys> => {
  const nestedSchemaEntries = Object.entries(meteoStationSchema()).map(([field, config]) => [
    `meteoStations.*.${field}`,
    {
      ...config,
      in: ['body']
    }
  ]);

  return {
    meteoStations: {
      in: ['body'],
      optional: true,
      isArray: {
        errorMessage: {
          code: APICode.InvalidParameter,
          message: 'meteoStations'
        }
      }
    },
    ...Object.fromEntries(nestedSchemaEntries)
  };
};

/**
 * Validation schema for creating or updating a city.
 */
export const citySchema = (): Schema<DefaultSchemaKeys> => ({
  name: {
    in: ['body'],
    // City name must be a string.
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'name'
      }
    },
    // City name is required and limited to 100 characters.
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
  province: {
    in: ['body'],
    optional: true,
    // Province must be a string when provided.
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'province'
      }
    },
    // Province length is limited to 100 characters.
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'province'
      }
    },
    // Remove leading and trailing spaces.
    trim: true
  },
  country: {
    in: ['body'],
    // Country must be a string.
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'country'
      }
    },
    // Country is required and limited to 100 characters.
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'country'
      }
    },
    // Remove leading and trailing spaces.
    trim: true
  },

  // Optional nested meteo stations to create/update together with the city.
  ...meteoStationsSchema()
});
