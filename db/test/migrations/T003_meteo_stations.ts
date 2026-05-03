import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meteo_stations', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.decimal('longitude', 10, 8).nullable();
    table.decimal('latitude', 10, 8).nullable();
    table.integer('created_by_id').unsigned().references('id').inTable('users');
    table.integer('updated_by_id').unsigned().references('id').inTable('users');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('meteo_stations');
}
