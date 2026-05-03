import { Router } from 'express';
import { buildOpenApiSpec } from '../../docs/openapi';
import { ApiRouteMount } from '../../docs/route-introspection';

export function createDocsRouter(routeMounts: ApiRouteMount[]): Router {
  const docsRouter = Router();

  docsRouter.get('/openapi.json', (req, res) => {
    res.status(200).json(buildOpenApiSpec(req, routeMounts));
  });

  docsRouter.get('/docs', (req, res) => {
    const specUrl = `${req.baseUrl}/openapi.json`;

    res.status(200).type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CARE WasteWater API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html, body {
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
      .docs-note {
        margin: 0;
        padding: 14px 20px;
        background: #fff4db;
        border-bottom: 1px solid #f0d79a;
        color: #6f4c00;
        font-size: 14px;
        line-height: 1.4;
      }
      .docs-note strong {
        color: #4f3500;
      }
    </style>
  </head>
  <body>
    <div class="docs-note">
      <strong>mTLS login:</strong> the <code>/auth</code> endpoint uses the client certificate selected by the browser during the HTTPS handshake.
      Swagger cannot upload a certificate file as part of the request body. Install/select the certificate in the browser first, then call <code>/auth</code>.
      In production, certificate validation is performed by the trusted upstream proxy and the API accepts the forwarded identity only from configured proxy IPs.
      When login succeeds, this page stores the returned bearer token automatically for the next requests.
    </div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      function applyAccessToken(accessToken) {
        if (!accessToken || !window.ui) return;
        window.ui.preauthorizeApiKey('bearerAuth', accessToken);
      }

      window.ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        displayRequestDuration: true,
        persistAuthorization: true,
        requestInterceptor: (request) => {
          request.credentials = 'include';
          return request;
        },
        responseInterceptor: (response) => {
          try {
            const requestUrl = response.url || '';
            const isAuthResponse = requestUrl.endsWith('/auth') || requestUrl.endsWith('/auth/refresh-token');
            const payload = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
            const accessToken = isAuthResponse ? payload?.accessToken : undefined;
            if (accessToken) {
              applyAccessToken(accessToken);
            }
          } catch (error) {
            console.warn('Swagger auth auto-capture failed', error);
          }
          return response;
        }
      });
    </script>
  </body>
</html>`);
  });

  return docsRouter;
}
