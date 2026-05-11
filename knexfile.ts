import { Knex } from 'knex';
import { knexSnakeCaseMappers } from 'objection';
import { appConfig } from './app/bootstrap/config';

export const knexConfig: Knex.Config = {
  client: 'pg',
  connection: {
    user: appConfig.database.user,
    database: appConfig.database.database,
    password: appConfig.database.password,
    port: appConfig.database.port,
    host: appConfig.database.isDocker ? `${appConfig.database.dockerContainerName}-postgres` : appConfig.database.host,
    timezone: 'UTC'
  },
  searchPath: ['public', 'master', 'rbac'],
  migrations: {
    directory: `db/${appConfig.nodeEnv}/migrations`
  },
  seeds: {
    directory: `db/${appConfig.nodeEnv}/seeds`
  },
  ...knexSnakeCaseMappers()
};
export default knexConfig;
