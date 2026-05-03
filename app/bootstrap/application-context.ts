import { RepositoryRegister } from '@repositories/repository-register';
import Knex from 'knex';
import { Model } from 'objection';
import { knexConfig } from '../../knexfile';

let isInitialized = false;

export const initializeApplicationContext = (): void => {
  if (isInitialized) return;

  /* -------------------------------------------------------------------------- */
  /*                               SHARED SETUP                                 */
  /* -------------------------------------------------------------------------- */

  // Initialize knex
  const knex = Knex(knexConfig);
  Model.knex(knex);

  // Register repositories
  RepositoryRegister.register();
  isInitialized = true;
};
