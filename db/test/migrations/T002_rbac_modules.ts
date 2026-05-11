import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .withSchema('rbac')
    .createTable('modules', function (table) {
      table.increments();
      table.integer('parent_id').references('id').inTable('modules');
      table.string('code', 100).notNullable().unique();
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamps(true, true);
    })
    .withSchema('rbac');
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('modules');
}
