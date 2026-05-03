import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('cities', (table) => {
    table.increments('id').primary();

    table.string('name', 100).notNullable();
    table.string('province', 100).nullable();
    table.string('country', 100).notNullable();

    table.timestamps(true, true);

    table.unique(['name', 'province', 'country']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cities');
}
