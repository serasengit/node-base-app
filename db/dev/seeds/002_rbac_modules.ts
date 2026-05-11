import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes all existing entries
  await knex.withSchema('rbac').table('modules').del();

  // Insert seed entries
  await knex.withSchema('rbac').table('modules').insert([
    {
      id: 1,
      code: 'users'
    },
    {
      id: 2,
      code: 'cities'
    },
    {
      id: 3,
      code: 'meteo_stations'
    }
  ]);
}
