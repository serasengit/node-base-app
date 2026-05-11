import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.withSchema('rbac').createTable('role_grants', function (table) {
    table.increments('id').primary();
    table.integer('role_id').references('id').inTable('roles').notNullable().onDelete('cascade');
    table.integer('grant_id').references('id').inTable('grants').notNullable().onDelete('cascade');
    table.timestamps(true, true);
    table.unique(['role_id', 'grant_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('role_grants');
}
