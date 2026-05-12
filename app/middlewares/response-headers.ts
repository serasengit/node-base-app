import { appConfig } from '@bootstrap/config';
import { NextFunction, Request, Response } from 'express';

/**
 * Prevents browsers and intermediaries from caching API responses.
 *
 * This is appropriate for API responses that may contain sensitive,
 * user-specific, session-specific, or operational information.
 */
export function noStoreCacheHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
}

/**
 * Applies baseline HTTP hardening headers for JSON APIs.
 *
 * This middleware intentionally avoids setting a Content-Security-Policy because
 * the service is expected to return API responses rather than render HTML.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedProtoValue = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const isForwardedSecure = forwardedProtoValue?.split(',')[0]?.trim().toLowerCase() === 'https';

  /*
   * HSTS should only be sent when the original client request used HTTPS.
   * In proxied deployments, this requires Express trust proxy to be configured
   * correctly; otherwise req.secure may not reflect the external protocol.
   */
  if (appConfig.isProduction && (req.secure || isForwardedSecure)) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}
