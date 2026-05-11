import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('public').createTable('cities', (table) => {
    table.increments('id').primary();

    table.string('name', 100).notNullable();
    table.string('province', 100).nullable();
    table.string('country', 100).notNullable();
    table.integer('created_by_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('updated_by_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    table.unique(['name', 'province', 'country']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('public').dropTableIfExists('cities');
}
