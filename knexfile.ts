import { Knex } from 'knex';
import { knexSnakeCaseMappers } from 'objection';

export const knexConfig: Knex.Config = {
  client: 'pg',
  connection: {
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: Number.parseInt(process.env.POSTGRES_PORT as string),
    host: process.env.IS_DOCKER ? `${process.env.DOCKER_CONTAINER_NAME}-postgres` : process.env.POSTGRES_HOST,
    timezone: 'UTC'
  },
  searchPath: ['public', 'master', 'rbac'],
  migrations: {
    directory: `db/${process.env.NODE_ENV}/migrations`
  },
  seeds: {
    directory: `db/${process.env.NODE_ENV}/seeds`
  },
  ...knexSnakeCaseMappers()
};
export default knexConfig;
