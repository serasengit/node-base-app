import * as bcrypt from 'bcrypt';
import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes all existing entries
  await knex.withSchema('rbac').table('users').del();

  const systemAdminRole = await knex.withSchema('rbac').table('roles').select('id').where({ code: 'system_administrator' }).first();

  const readonlyRole = await knex.withSchema('rbac').table('roles').select('id').where({ code: 'read_only' }).first();

  await knex
    .withSchema('rbac')
    .table('users')
    .insert([
      {
        nif: '00000000T',
        username: 'system_admin',
        password: await bcrypt.hash('Admin123!', 10),
        name: 'System Admin User',
        email: 'admin@example.com',
        language: 'es',
        role_id: systemAdminRole.id
      },
      {
        nif: '00000001R',
        username: 'readonly',
        password: await bcrypt.hash('Readonly123!', 10),
        name: 'Read Only User',
        email: 'readonly@example.com',
        language: 'es',
        role_id: readonlyRole.id
      }
    ]);
}
