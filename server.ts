import 'module-alias/register';
import 'reflect-metadata';

import { apiRouter } from '@routes/api-routes';
import cors, { CorsOptions } from 'cors';
import express, { json } from 'express';

// Initialize the app
const app = express();
// Initialize the app
// Configure CORS policy
// To check if CORS restriction is working you can run adasa-test-front-end project in a different port than 8080
const options: CorsOptions = {
  origin: process.env.DOMAIN_WHITELIST.split(','),
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};
// Express JSON
app.use(json());
// CORS middleware
app.use(cors(options));
// API routes configuration
app.use(`/api/${process.env.API_VERSION}`, apiRouter);
// Launch app to listen to specified host and port
app.listen(parseInt(process.env.SERVER_PORT), process.env.SERVER_HOST, () => {
  console.log(`Server started at  http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`);
});

export default app;
