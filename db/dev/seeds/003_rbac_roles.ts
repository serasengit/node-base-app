import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes all existing entries
  await knex.withSchema('rbac').table('roles').del();

  // Insert seed entries
  await knex
    .withSchema('rbac')
    .table('roles')
    .insert([
      {
        code: 'system_administrator'
      },
      {
        code: 'read_only'
      }
    ]);
}
