import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .withSchema('rbac')
    .createTable('grants', function (table) {
      table.increments('id').primary();
      table.boolean('can_read').notNullable().defaultTo(false);
      table.boolean('can_create').notNullable().defaultTo(false);
      table.boolean('can_edit').notNullable().defaultTo(false);
      table.boolean('can_delete').notNullable().defaultTo(false);
      table.integer('module_id').references('id').inTable('modules').notNullable().onDelete('cascade');
      table.string('description', 255).notNullable().unique();
      table.timestamps(true, true);
      table.unique(['can_read', 'can_create', 'can_edit', 'can_delete', 'module_id']);
    })
    .withSchema('rbac');
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('grants');
}
