import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();

    table.string('nif', 9).notNullable().unique();
    table.string('name', 100).notNullable();
    table.string('email', 255).notNullable().unique();

    table.integer('created_by_id').unsigned().references('id').inTable('users');
    table.integer('updated_by_id').unsigned().references('id').inTable('users');

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
