import { APICode } from '@api-messages/api-messages';
import { Schema } from 'express-validator';
import { DefaultSchemaKeys } from 'express-validator/lib/middlewares/schema';

// Columns allowed for user pagination and sorting.
export const userPaginationColumns = ['id', 'username', 'nif', 'name', 'email', 'language', 'isActive', 'createdAt', 'updatedAt'];

/**
 * Validation schema for searching users.
 *
 * Supports an optional textSearch query parameter.
 */
export const findUsersSchema = (): Schema<DefaultSchemaKeys> => ({
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
 * Validation schema for optional user relations.
 *
 * The include query parameter supports comma-separated values, for example:
 * include=role,createdBy
 */
export const userRelationSchema = (): Schema<DefaultSchemaKeys> => ({
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
        const allowedRelations = new Set(['role', 'roleGrants', 'roleGrantsModule', 'createdBy', 'updatedBy']);

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
 * Validation schema for creating or updating a user.
 */
export const userSchema = (): Schema<DefaultSchemaKeys> => ({
  username: {
    in: ['body'],
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'username'
      }
    },
    isLength: {
      options: { min: 3, max: 100 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'username'
      }
    },
    trim: true
  },
  password: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'password'
      }
    },
    isLength: {
      options: { min: 8, max: 255 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'password'
      }
    }
  },
  nif: {
    in: ['body'],
    isString: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'nif'
      }
    },
    isLength: {
      options: { min: 9, max: 9 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'nif'
      }
    },
    trim: true
  },
  name: {
    in: ['body'],
    optional: true,
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
  email: {
    in: ['body'],
    optional: true,
    isEmail: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'email'
      }
    },
    isLength: {
      options: { max: 255 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'email'
      }
    },
    normalizeEmail: true
  },
  language: {
    in: ['body'],
    isIn: {
      options: [['es', 'en']],
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'language'
      }
    }
  },
  roleId: {
    in: ['body'],
    isInt: {
      options: { min: 1 },
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'roleId'
      }
    },
    toInt: true
  },
  isActive: {
    in: ['body'],
    isBoolean: {
      errorMessage: {
        code: APICode.InvalidParameter,
        message: 'isActive'
      }
    },
    toBoolean: true
  }
});
