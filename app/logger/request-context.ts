import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  // Unique identifier used to correlate logs and operations for a single request.
  requestId: string;

  // HTTP method associated with the current request.
  method?: string;

  // Request path or original URL associated with the current request.
  path?: string;

  // Authenticated user ID, usually added after the authentication middleware runs.
  userId?: number;
};

// Stores request-scoped data across asynchronous calls.
// This allows services, repositories, and loggers to access the current request context
// without explicitly passing request metadata through every function call.
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Runs the provided callback inside a request-specific context.
 *
 * Any asynchronous operation started within this callback will be able to access
 * the same context through getRequestContext().
 */
export const runWithRequestContext = <T>(context: RequestContext, callback: () => T): T => requestContextStorage.run(context, callback);

/**
 * Returns the context associated with the current asynchronous execution flow.
 *
 * If the code is running outside a request context, this returns undefined.
 */
export const getRequestContext = (): RequestContext | undefined => requestContextStorage.getStore();

/**
 * Updates the current request context with additional metadata.
 *
 * This is useful when some information is only available later in the request lifecycle,
 * such as the authenticated user ID after token validation.
 */
export const updateRequestContext = (partialContext: Partial<RequestContext>): void => {
  const currentContext = requestContextStorage.getStore();

  // Nothing to update when the code is running outside a request context.
  if (!currentContext) return;

  // Mutates the existing context so all downstream code sees the updated values.
  Object.assign(currentContext, partialContext);
};
