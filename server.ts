import './app/bootstrap/register-module-aliases';
import 'reflect-metadata';

import { createApiApp, startHttpServers } from './app/bootstrap/api-runtime';
import { initializeApplicationContext } from './app/bootstrap/application-context';

// Initialize shared application infrastructure once before resolving routes/services.
initializeApplicationContext();

// App factory entrypoint used by tests and by the HTTP runtime bootstrap.
const app = createApiApp();

if (require.main === module) {
  startHttpServers(app);
}

export default app;
