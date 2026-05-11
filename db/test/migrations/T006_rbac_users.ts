import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('rbac').createTable('users', (table) => {
    table.increments('id').primary();
    table.string('nif', 9).nullable().unique();
    table.string('username', 100).nullable().unique();
    table.string('password', 100).nullable();
    table.string('name', 100).nullable();
    table.string('email', 255).nullable().unique();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.string('language', 5).notNullable().defaultTo('es');
    table.integer('role_id').notNullable().unsigned().references('id').inTable('roles').onDelete('CASCADE');
    table.integer('created_by_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('updated_by_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('rbac').dropTableIfExists('users');
}
