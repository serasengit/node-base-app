/**
 * Wraps asynchronous route handlers and forwards rejected promises
 * to the Express error handling middleware.
 */
export function asyncHandler(fn) {
  return (req, res, next): void => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}
