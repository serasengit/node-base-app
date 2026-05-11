import { Router } from 'express';

type OpenApiObject = Record<string, unknown>;

export type OpenApiPaths = Record<string, OpenApiObject>;

export type ApiRouteMount = {
  /**
   * Base path where the router is mounted.
   *
   * Example:
   * /cities
   * /meteo-stations
   */
  path: string;

  /**
   * Express router mounted under the base path.
   */
  router: Router;

  /**
   * Indicates whether the mounted route group should be considered protected.
   *
   * This is useful for documentation generation, even if the current skeleton
   * does not enforce authentication by default.
   */
  protected?: boolean;
};

/**
 * Converts an Express route path into an OpenAPI-compatible path.
 *
 * Example:
 * /cities/:id -> /cities/{id}
 */
function normalizeOpenApiPath(path: string): string {
  return path.replace(/:([^/]+)/g, '{$1}');
}

/**
 * Joins a mounted base path and a router path into a single URL path.
 *
 * Examples:
 * path: /cities, routePath: /       -> /cities
 * path: /cities, routePath: /:id    -> /cities/:id
 */
function joinPaths(basePath: string, routePath: string): string {
  const fullPath = `/${basePath}/${routePath}`.replace(/\/+/g, '/').replace(/\/$/, '');

  return fullPath || '/';
}

/**
 * Extracts the HTTP methods registered in an Express route layer.
 */
function getRouteMethods(layer: any): string[] {
  if (!layer.route?.methods) return [];

  return Object.keys(layer.route.methods).filter((method) => layer.route.methods[method]);
}

/**
 * Extracts route paths from an Express route layer.
 */
function getRoutePaths(layer: any): string[] {
  if (!layer.route?.path) return [];

  const path = layer.route.path;

  if (Array.isArray(path)) {
    return path.map(String);
  }

  return [String(path)];
}

/**
 * Creates a basic OpenAPI operation placeholder for discovered routes.
 */
function createDiscoveredOperation(method: string, routeMount: ApiRouteMount): OpenApiObject {
  return {
    summary: `Discovered ${method.toUpperCase()} endpoint`,
    ...(routeMount.protected ? { security: [{ bearerAuth: [] }] } : {}),
    responses: {
      200: {
        description: 'Successful response.'
      }
    }
  };
}

/**
 * Collects mounted Express router paths and converts them into OpenAPI paths.
 */
export function collectMountedRouterPaths(routeMounts: ApiRouteMount[]): OpenApiPaths {
  const paths: OpenApiPaths = {};

  for (const mount of routeMounts) {
    const stack = (mount.router as any).stack ?? [];

    for (const layer of stack) {
      const routePaths = getRoutePaths(layer);
      const methods = getRouteMethods(layer);

      for (const routePath of routePaths) {
        const openApiPath = normalizeOpenApiPath(joinPaths(mount.path, routePath));

        if (!paths[openApiPath]) {
          paths[openApiPath] = {};
        }

        const pathItem = paths[openApiPath] as Record<string, OpenApiObject>;

        for (const method of methods) {
          if (!pathItem[method]) {
            pathItem[method] = createDiscoveredOperation(method, mount);
          }
        }
      }
    }
  }

  return paths;
}

/**
 * Deep-merges discovered OpenAPI paths with manually documented paths.
 *
 * Manual definitions take precedence when the same path and method exist.
 */
export function mergeOpenApiPaths(discoveredPaths: OpenApiPaths, documentedPaths: OpenApiPaths): OpenApiPaths {
  const mergedPaths: OpenApiPaths = {
    ...discoveredPaths
  };

  for (const [path, documentedPathItem] of Object.entries(documentedPaths)) {
    const discoveredPathItem = (mergedPaths[path] as Record<string, unknown>) ?? {};

    mergedPaths[path] = {
      ...discoveredPathItem,
      ...(documentedPathItem as Record<string, unknown>)
    };
  }

  return mergedPaths;
}
