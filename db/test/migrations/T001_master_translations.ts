import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('master').createTable('translations', (table) => {
    table.increments('id').primary();

    table.string('code').notNullable();
    table.string('language', 5).notNullable();
    table.text('text').notNullable();

    table.timestamps(true, true);

    table.unique(['code', 'language']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('translations');
}
