import { findResourceSchema, paginationSchema } from '@core/routes/common-route-schema';
import { authSchema } from '@features/auth/routes/auth-route-schema';
import { cityPaginationColumns, cityRelationSchema, citySchema, findCitiesSchema } from '@features/cities/routes/city-route-schema';
import {
  findMeteoStationsSchema,
  meteoStationPaginationColumns,
  meteoStationRelationSchema,
  meteoStationSchema
} from '@features/meteo-stations/routes/meteo-station-route-schema';
import { findUsersSchema, userPaginationColumns, userRelationSchema, userSchema } from '@features/users/routes/user-route-schema';
import express from 'express';
import { ApiRouteMount, collectMountedRouterPaths, mergeOpenApiPaths } from './route-introspection';
import { jsonRequestBodyFromValidationSchemas, parametersFromValidationSchemas } from './validation-schema-openapi';

type OpenApiObject = Record<string, unknown>;

function serverUrl(req: express.Request): string {
  return `${req.protocol}://${req.get('host')}${req.baseUrl}`;
}

function jsonContent(schema: OpenApiObject): OpenApiObject {
  return {
    'application/json': {
      schema
    }
  };
}

function response(description: string, schemaRef?: string): OpenApiObject {
  return {
    description,
    ...(schemaRef ? { content: jsonContent({ $ref: schemaRef }) } : {})
  };
}

function paginatedResponse(schemaRef: string): OpenApiObject {
  return {
    description: 'Paginated response.',
    content: jsonContent({
      allOf: [
        { $ref: '#/components/schemas/QueryResponseBase' },
        {
          type: 'object',
          properties: {
            records: {
              type: 'array',
              items: { $ref: schemaRef }
            }
          }
        }
      ]
    })
  };
}

function operation(summary: string, extra: Partial<OpenApiObject> = {}, requiresAuth = true, tag = 'Meteo Stations'): OpenApiObject {
  const defaultResponses: OpenApiObject = {
    400: response('Bad request.', '#/components/schemas/ApiError'),
    401: response('Unauthorized.', '#/components/schemas/ApiError'),
    403: response('Forbidden.', '#/components/schemas/ApiError'),
    422: response('Validation error.', '#/components/schemas/ApiError'),
    500: response('Unexpected server error.', '#/components/schemas/ApiError')
  };
  const extraResponses = (extra.responses as OpenApiObject) ?? {};
  const restExtra = { ...(extra as Record<string, unknown>) };
  delete restExtra.responses;

  return {
    tags: [tag],
    summary,
    ...(requiresAuth ? { security: [{ bearerAuth: [] }] } : {}),
    responses: {
      ...defaultResponses,
      ...extraResponses
    },
    ...restExtra
  };
}

export function buildOpenApiSpec(req: express.Request, routeMounts: ApiRouteMount[] = []): OpenApiObject {
  const discoveredPaths = collectMountedRouterPaths(routeMounts);
  const authRequestBody = jsonRequestBodyFromValidationSchemas(authSchema());
  const cityRequestBody = jsonRequestBodyFromValidationSchemas(citySchema());
  const meteoStationRequestBody = jsonRequestBodyFromValidationSchemas(meteoStationSchema());
  const userRequestBody = jsonRequestBodyFromValidationSchemas(userSchema());
  const authExample = {
    default: {
      summary: 'Sample credentials',
      value: {
        username: 'system_admin',
        password: '<user-password>'
      }
    }
  };
  const cityExample = {
    default: {
      summary: 'Sample city',
      value: {
        name: 'Logrono',
        province: 'La Rioja',
        country: 'Spain'
      }
    }
  };
  const meteoStationExample = {
    default: {
      summary: 'Sample meteo station',
      value: {
        name: 'Logrono North',
        longitude: -2.4457,
        latitude: 42.4627
      }
    }
  };
  const userExample = {
    default: {
      summary: 'Sample user',
      value: {
        username: 'readonly_2',
        password: '<user-password>',
        nif: '12345678A',
        name: 'Read Only User 2',
        email: 'readonly2@example.com',
        language: 'es',
        roleId: 2,
        isActive: true
      }
    }
  };

  if (authRequestBody?.content && typeof authRequestBody.content === 'object') {
    (authRequestBody.content as Record<string, OpenApiObject>)['application/json'] = {
      ...((authRequestBody.content as Record<string, OpenApiObject>)['application/json'] ?? {}),
      examples: authExample
    };
  }

  if (meteoStationRequestBody?.content && typeof meteoStationRequestBody.content === 'object') {
    (meteoStationRequestBody.content as Record<string, OpenApiObject>)['application/json'] = {
      ...((meteoStationRequestBody.content as Record<string, OpenApiObject>)['application/json'] ?? {}),
      examples: meteoStationExample
    };
  }

  if (cityRequestBody?.content && typeof cityRequestBody.content === 'object') {
    (cityRequestBody.content as Record<string, OpenApiObject>)['application/json'] = {
      ...((cityRequestBody.content as Record<string, OpenApiObject>)['application/json'] ?? {}),
      examples: cityExample
    };
  }

  if (userRequestBody?.content && typeof userRequestBody.content === 'object') {
    (userRequestBody.content as Record<string, OpenApiObject>)['application/json'] = {
      ...((userRequestBody.content as Record<string, OpenApiObject>)['application/json'] ?? {}),
      examples: userExample
    };
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'Node Base App API',
      version: '1.0.0',
      description:
        'OpenAPI documentation for the Node Base App backend skeleton. This API provides a reusable TypeScript and Express architecture with feature-based modules, Objection.js models, Knex database access, validation schemas, standardized responses and generated route documentation.',
      contact: {
        name: 'Sergio Asensio Puyuelo'
      }
    },
    servers: [
      {
        url: serverUrl(req),
        description: 'Current server'
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints for login, token refresh and logout.'
      },
      {
        name: 'Users',
        description: 'CRUD endpoints for users and RBAC-related user lookups.'
      },
      {
        name: 'Cities',
        description: 'CRUD endpoints for cities.'
      },
      {
        name: 'Meteo Stations',
        description: 'CRUD endpoints for meteo stations.'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            status: { type: 'integer' },
            message: { type: 'string' },
            details: {
              nullable: true
            }
          }
        },
        QueryResponseBase: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            records: {
              type: 'array',
              items: {}
            }
          }
        },
        AuthenticatedUser: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string', nullable: true },
            name: { type: 'string', nullable: true },
            language: { type: 'string', enum: ['es', 'en'], nullable: true },
            role: { $ref: '#/components/schemas/Role' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            isAuthenticated: { type: 'boolean' },
            user: { $ref: '#/components/schemas/AuthenticatedUser' },
            permissions: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        RefreshTokenResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string', enum: ['system_administrator', 'read_only'] },
            description: { type: 'string', nullable: true }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string', nullable: true },
            nif: { type: 'string' },
            name: { type: 'string', nullable: true },
            displayName: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true },
            language: { type: 'string', enum: ['es', 'en'], nullable: true },
            roleId: { type: 'integer', nullable: true },
            isActive: { type: 'boolean' },
            createdById: { type: 'integer', nullable: true },
            updatedById: { type: 'integer', nullable: true },
            createdAt: { type: 'string', format: 'date-time', nullable: true },
            updatedAt: { type: 'string', format: 'date-time', nullable: true },
            role: { $ref: '#/components/schemas/Role' },
            createdBy: { $ref: '#/components/schemas/UserSummary' },
            updatedBy: { $ref: '#/components/schemas/UserSummary' }
          }
        },
        UserSummary: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string', nullable: true },
            nif: { type: 'string' },
            name: { type: 'string', nullable: true },
            displayName: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true },
            language: { type: 'string', enum: ['es', 'en'], nullable: true },
            roleId: { type: 'integer', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time', nullable: true },
            updatedAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        UserWriteRequest: {
          type: 'object',
          required: ['username', 'nif', 'language', 'roleId', 'isActive'],
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 100 },
            password: { type: 'string', minLength: 8, maxLength: 255, nullable: true },
            nif: { type: 'string', minLength: 9, maxLength: 9 },
            name: { type: 'string', minLength: 1, maxLength: 100, nullable: true },
            email: { type: 'string', format: 'email', maxLength: 255, nullable: true },
            language: { type: 'string', enum: ['es', 'en'] },
            roleId: { type: 'integer' },
            isActive: { type: 'boolean' }
          },
          example: userExample.default.value
        },
        City: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            province: { type: 'string', nullable: true },
            country: { type: 'string' },
            createdById: { type: 'integer', nullable: true },
            updatedById: { type: 'integer', nullable: true },
            createdAt: { type: 'string', format: 'date-time', nullable: true },
            updatedAt: { type: 'string', format: 'date-time', nullable: true },
            meteoStations: {
              type: 'array',
              items: { $ref: '#/components/schemas/MeteoStation' }
            },
            createdBy: { $ref: '#/components/schemas/UserSummary' },
            updatedBy: { $ref: '#/components/schemas/UserSummary' }
          }
        },
        MeteoStation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            longitude: { type: 'number' },
            latitude: { type: 'number' },
            createdById: { type: 'integer', nullable: true },
            updatedById: { type: 'integer', nullable: true },
            createdAt: { type: 'string', format: 'date-time', nullable: true },
            updatedAt: { type: 'string', format: 'date-time', nullable: true },
            city: { $ref: '#/components/schemas/City' },
            createdBy: { $ref: '#/components/schemas/UserSummary' },
            updatedBy: { $ref: '#/components/schemas/UserSummary' }
          }
        },
        MeteoStationWriteRequest: {
          type: 'object',
          required: ['name', 'longitude', 'latitude'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            longitude: { type: 'number' },
            latitude: { type: 'number' }
          },
          example: meteoStationExample.default.value
        },
        CityWriteRequest: {
          type: 'object',
          required: ['name', 'country'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            province: { type: 'string', minLength: 1, maxLength: 100, nullable: true },
            country: { type: 'string', minLength: 1, maxLength: 100 }
          },
          example: cityExample.default.value
        }
      }
    },
    paths: mergeOpenApiPaths(discoveredPaths, {
      '/auth': {
        post: operation(
          'Authenticate user',
          {
            description: 'Authenticates a user using username and password, returns an access token and sets the refresh token cookie.',
            requestBody: authRequestBody,
            responses: {
              200: response('Authentication succeeded.', '#/components/schemas/AuthResponse'),
              403: response('Invalid credentials or inactive user.', '#/components/schemas/ApiError'),
              429: response('Too many authentication attempts. Try again later.', '#/components/schemas/ApiError')
            }
          },
          false,
          'Auth'
        )
      },
      '/auth/refresh-token': {
        post: operation(
          'Refresh access token',
          {
            description: 'Rotates the refresh token cookie and returns a new access token.',
            responses: {
              200: response('Access token refreshed.', '#/components/schemas/RefreshTokenResponse'),
              401: response('Refresh token is missing, invalid or expired.', '#/components/schemas/ApiError'),
              429: response('Too many refresh attempts. Try again later.', '#/components/schemas/ApiError')
            }
          },
          false,
          'Auth'
        )
      },
      '/auth/logout': {
        post: operation(
          'Logout user',
          {
            description: 'Clears the refresh token cookie from the current browser session.',
            responses: {
              200: { description: 'Logout succeeded and the refresh token cookie was cleared.' }
            }
          },
          false,
          'Auth'
        )
      },
      '/users': {
        get: operation(
          'List users',
          {
            description: 'Returns a paginated list of users.',
            parameters: parametersFromValidationSchemas(findUsersSchema(), userRelationSchema(), paginationSchema(userPaginationColumns)),
            responses: {
              200: paginatedResponse('#/components/schemas/User')
            }
          },
          true,
          'Users'
        ),
        post: operation(
          'Create user',
          {
            description: 'Creates a new user.',
            requestBody: userRequestBody,
            responses: {
              201: response('User created.', '#/components/schemas/User'),
              404: response('Role not found.', '#/components/schemas/ApiError'),
              409: response('User already exists.', '#/components/schemas/ApiError')
            }
          },
          true,
          'Users'
        )
      },
      '/users/{id}': {
        get: operation(
          'Get user by id',
          {
            description: 'Returns one user by identifier.',
            parameters: parametersFromValidationSchemas(findResourceSchema(), userRelationSchema()),
            responses: {
              200: response('User found.', '#/components/schemas/User'),
              404: response('User not found.', '#/components/schemas/ApiError')
            }
          },
          true,
          'Users'
        ),
        put: operation(
          'Update user',
          {
            description: 'Updates an existing user.',
            parameters: parametersFromValidationSchemas(findResourceSchema()),
            requestBody: userRequestBody,
            responses: {
              200: response('User updated.', '#/components/schemas/User'),
              404: response('User or role not found.', '#/components/schemas/ApiError'),
              409: response('User already exists or cannot modify own role.', '#/components/schemas/ApiError')
            }
          },
          true,
          'Users'
        ),
        delete: operation(
          'Delete user',
          {
            description: 'Deletes a user.',
            parameters: parametersFromValidationSchemas(findResourceSchema()),
            responses: {
              204: { description: 'User deleted.' },
              404: response('User not found.', '#/components/schemas/ApiError')
            }
          },
          true,
          'Users'
        )
      },
      '/cities': {
        get: operation(
          'List cities',
          {
            description: 'Returns a paginated list of cities.',
            parameters: parametersFromValidationSchemas(findCitiesSchema(), cityRelationSchema(), paginationSchema(cityPaginationColumns)),
            responses: {
              200: paginatedResponse('#/components/schemas/City')
            }
          },
          true,
          'Cities'
        ),
        post: operation(
          'Create city',
          {
            description: 'Creates a new city.',
            requestBody: cityRequestBody,
            responses: {
              201: response('City created.', '#/components/schemas/City'),
              409: response('City already exists.', '#/components/schemas/ApiError')
            }
          },
          true,
          'Cities'
        )
      },
      '/cities/{id}': {
        get: operation(
          'Get city by id',
          {
            description: 'Returns one city by identifier.',
            parameters: parametersFromValidationSchemas(findResourceSchema(), cityRelationSchema()),
            responses: {
              200: response('City found.', '#/components/schemas/City'),
              404: response('City not found.', '#/components/schemas/ApiError')
            }
          },
          true,
          'Cities'
        ),
        put: operation(
          'Update city',
          {
            description: 'Updates an existing city.',
            parameters: parametersFromValidationSchemas(findResourceSchema()),
            requestBody: cityRequestBody,
            responses: {
              200: response('City updated.', '#/components/schemas/City'),
              404: response('City not found.', '#/components/schemas/ApiError'),
              409: response('City already exists.', '#/components/schemas/ApiError')
            }
          },
          true,
          'Cities'
        ),
        delete: operation(
          'Delete city',
          {
            description: 'Deletes a city.',
            parameters: parametersFromValidationSchemas(findResourceSchema()),
            responses: {
              204: { description: 'City deleted.' },
              404: response('City not found.', '#/components/schemas/ApiError')
            }
          },
          true,
          'Cities'
        )
      },
      '/meteo-stations': {
        get: operation('List meteo stations', {
          description: 'Returns a paginated list of meteo stations.',
          parameters: parametersFromValidationSchemas(
            findMeteoStationsSchema(),
            meteoStationRelationSchema(),
            paginationSchema(meteoStationPaginationColumns)
          ),
          responses: {
            200: paginatedResponse('#/components/schemas/MeteoStation')
          }
        }),
        post: operation('Create meteo station', {
          description: 'Creates a new meteo station.',
          requestBody: meteoStationRequestBody,
          responses: {
            201: response('Meteo station created.', '#/components/schemas/MeteoStation'),
            409: response('Meteo station already exists.', '#/components/schemas/ApiError')
          }
        })
      },
      '/meteo-stations/{id}': {
        get: operation('Get meteo station by id', {
          description: 'Returns one meteo station by identifier.',
          parameters: parametersFromValidationSchemas(findResourceSchema(), meteoStationRelationSchema()),
          responses: {
            200: response('Meteo station found.', '#/components/schemas/MeteoStation'),
            404: response('Meteo station not found.', '#/components/schemas/ApiError')
          }
        }),
        put: operation('Update meteo station', {
          description: 'Updates an existing meteo station.',
          parameters: parametersFromValidationSchemas(findResourceSchema()),
          requestBody: meteoStationRequestBody,
          responses: {
            200: response('Meteo station updated.', '#/components/schemas/MeteoStation'),
            404: response('Meteo station not found.', '#/components/schemas/ApiError'),
            409: response('Meteo station already exists.', '#/components/schemas/ApiError')
          }
        }),
        delete: operation('Delete meteo station', {
          description: 'Deletes a meteo station.',
          parameters: parametersFromValidationSchemas(findResourceSchema()),
          responses: {
            204: { description: 'Meteo station deleted.' },
            404: response('Meteo station not found.', '#/components/schemas/ApiError')
          }
        })
      }
    })
  };
}
