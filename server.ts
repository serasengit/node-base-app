import './app/bootstrap/register-module-aliases';
import 'reflect-metadata';

import { startApiRuntime } from './app/bootstrap/api-runtime';
import { initializeApplicationContext } from './app/bootstrap/application-context';

// Initialize shared application infrastructure once before resolving routes/services.
initializeApplicationContext();

// API runtime entrypoint
const app = startApiRuntime();

export default app;
