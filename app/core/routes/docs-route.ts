import { Router } from 'express';
import { buildOpenApiSpec } from '../../docs/openapi';
import { ApiRouteMount } from '../../docs/route-introspection';

export function createDocsRouter(routeMounts: ApiRouteMount[]): Router {
  const docsRouter = Router();

  /**
   * Disable browser/proxy cache for API documentation routes.
   * This is useful during development because the OpenAPI document is generated dynamically.
   */
  docsRouter.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  /**
   * OpenAPI JSON specification.
   *
   * The document is generated on each request to keep it updated when routes,
   * schemas or metadata change during development.
   */
  docsRouter.get('/openapi.json', (req, res) => {
    res.status(200).json(buildOpenApiSpec(req, routeMounts));
  });

  /**
   * Swagger UI documentation page.
   */
  docsRouter.get('/docs', (req, res) => {
    const specUrl = `${req.baseUrl}/openapi.json?t=${Date.now()}`;

    res.status(200).type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Node Base App API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        background: #f5f7fb;
      }

      body {
        font-family: Arial, sans-serif;
      }

      .topbar {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        displayRequestDuration: true,
        persistAuthorization: true,
        requestInterceptor: (request) => {
          request.credentials = 'include';
          return request;
        }
      });
    </script>
  </body>
</html>`);
  });

  return docsRouter;
}
