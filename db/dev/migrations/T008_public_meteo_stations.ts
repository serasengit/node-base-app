import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('public').createTable('meteo_stations', (table) => {
    table.increments('id').primary();

    table.string('name', 100).notNullable().unique();
    table.decimal('longitude', 10, 8).nullable();
    table.decimal('latitude', 10, 8).nullable();
    table.integer('city_id').unsigned().references('id').inTable('cities').onDelete('CASCADE');
    table.integer('created_by_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('updated_by_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('public').dropTableIfExists('meteo_stations');
}
