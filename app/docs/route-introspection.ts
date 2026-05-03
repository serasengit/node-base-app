import { Router } from 'express';

type OpenApiObject = Record<string, unknown>;
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type ApiRouteMount = {
  path: string;
  router: Router;
  protected: boolean;
};

type RouteLayer = {
  route?: {
    path?: string | string[];
    methods?: Record<string, boolean>;
  };
};

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete'];

/**
 * Ensures a path starts with `/`.
 */
function normalizePath(path: string): string {
  if (!path.startsWith('/')) return `/${path}`;
  return path;
}

/**
 * Converts Express params (e.g. `:id`) into OpenAPI params (`{id}`).
 */
function normalizeExpressPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

/**
 * Converts a slug/snake value into a title-cased label.
 */
function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Resolves the OpenAPI tag from the first segment of a mounted router path.
 */
function tagFromMountPath(path: string): string {
  const segment = normalizePath(path).split('/').find(Boolean) ?? 'General';

  const mapping: Record<string, string> = {
    auth: 'Auth',
    'access-logs': 'Access Logs',
    users: 'Users',
    entities: 'Entities',
    roles: 'Roles',
    settings: 'Settings',
    'alarm-types': 'Alarm Types',
    alarms: 'Alarms',
    authorizations: 'Authorizations',
    inspections: 'Inspections',
    analytics: 'Analytics',
    cities: 'Cities',
    'meteo-stations': 'Meteo Stations',
    'config-master-tables': 'Master Tables',
    'parameter-values': 'Parameter Values',
    'check-points': 'Check Points',
    canons: 'Canons',
    'canon-formulas': 'Canon Formulas',
    'canon-parameters': 'Canon Parameters'
  };

  return mapping[segment] ?? titleCase(segment);
}

/**
 * Builds a fallback summary for auto-generated operations.
 */
function defaultSummary(method: HttpMethod, fullPath: string): string {
  const cleaned = fullPath
    .replace(/^\//, '')
    .replace(/\{[^}]+\}/g, 'by id')
    .replace(/\//g, ' ')
    .trim();

  const verbs: Record<HttpMethod, string> = {
    get: 'Get',
    post: 'Create',
    put: 'Update',
    patch: 'Patch',
    delete: 'Delete'
  };

  return `${verbs[method]} ${cleaned || 'root'}`;
}

/**
 * Creates a generic OpenAPI operation object for auto-discovered routes.
 */
function genericOperation(method: HttpMethod, fullPath: string, tag: string, isProtected: boolean): OpenApiObject {
  const successCode = method === 'post' ? '201' : method === 'delete' ? '204' : '200';

  return {
    tags: [tag],
    summary: defaultSummary(method, fullPath),
    description: 'Auto-discovered from Express router configuration. Add a manual override in OpenAPI docs for richer details.',
    ...(isProtected ? { security: [{ bearerAuth: [] }, { refreshTokenCookie: [] }] } : {}),
    responses: {
      [successCode]:
        method === 'delete'
          ? { description: 'Operation completed successfully.' }
          : {
              description: 'Successful response.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/GenericRecord' }
                }
              }
            },
      400: {
        description: 'Validation error.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' }
          }
        }
      },
      401: {
        description: 'Unauthorized.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' }
          }
        }
      },
      403: {
        description: 'Forbidden.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' }
          }
        }
      },
      422: {
        description: 'Unprocessable Entity.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' }
          }
        }
      }
    }
  };
}

/**
 * Introspects mounted Express routers and returns OpenAPI path operations inferred from route metadata.
 */
export function collectMountedRouterPaths(mounts: ApiRouteMount[]): Record<string, OpenApiObject> {
  const paths: Record<string, OpenApiObject> = {};

  for (const mount of mounts) {
    const stack = ((mount.router as unknown as { stack?: RouteLayer[] }).stack ?? []).filter((layer) => Boolean(layer.route));
    const tag = tagFromMountPath(mount.path);

    for (const layer of stack) {
      const route = layer.route;
      if (!route?.path) continue;

      const routePaths = Array.isArray(route.path) ? route.path : [route.path];

      for (const routePath of routePaths) {
        const fullPath = normalizeExpressPath(`${normalizePath(mount.path)}${routePath === '/' ? '' : routePath}`);

        if (fullPath === '/docs' || fullPath === '/openapi.json') {
          continue;
        }

        paths[fullPath] ||= {};

        for (const method of HTTP_METHODS) {
          if (!route.methods?.[method]) continue;
          paths[fullPath][method] = genericOperation(method, fullPath, tag, mount.protected);
        }
      }
    }
  }

  return paths;
}

/**
 * Merges documented OpenAPI paths over auto-discovered paths, giving precedence to documented operations.
 */
export function mergeOpenApiPaths(
  discoveredPaths: Record<string, OpenApiObject>,
  documentedPaths: Record<string, OpenApiObject>
): Record<string, OpenApiObject> {
  const merged: Record<string, OpenApiObject> = { ...discoveredPaths };

  for (const [path, operations] of Object.entries(documentedPaths)) {
    merged[path] = {
      ...merged[path],
      ...operations
    };
  }

  return merged;
}
