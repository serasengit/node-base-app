import { Knex } from 'knex';

type GrantDefinition = {
  module: string;
  can_read?: boolean;
  can_create?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  description: string;
};

export async function seed(knex: Knex): Promise<void> {
  // Clean existing data
  await knex.withSchema('rbac').table('grants').del();

  const grants: GrantDefinition[] = [
    // --- Users ---
    { module: 'users', can_read: true, description: 'Grants read permissions into users module' },
    {
      module: 'users',
      can_read: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
      description: 'Grants read,create,edit and delete permissions into users module'
    },
    // --- Cities ---
    { module: 'cities', can_read: true, description: 'Grants read permissions into cities module' },
    {
      module: 'cities',
      can_read: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
      description: 'Grants read,create,edit and delete permissions into cities module'
    },
    // --- Meteo Stations ---
    { module: 'meteo_stations', can_read: true, description: 'Grants read permissions into meteo stations module' },
    {
      module: 'meteo_stations',
      can_read: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
      description: 'Grants read,create,edit and delete permissions into meteo_stations module'
    }
  ];

  const moduleCodes = [...new Set(grants.map((grant) => grant.module))];
  const modules = await knex.withSchema('rbac').table('modules').select('id', 'code').whereIn('code', moduleCodes);
  const moduleIds = new Map(modules.map((module) => [module.code, module.id]));
  const missingModules = moduleCodes.filter((code) => !moduleIds.has(code));

  if (missingModules.length > 0) {
    throw new Error(`Missing RBAC modules for grants seed: ${missingModules.join(', ')}`);
  }

  const inserts = grants.map((g) => ({
    can_read: g.can_read ?? false,
    can_create: g.can_create ?? false,
    can_edit: g.can_edit ?? false,
    can_delete: g.can_delete ?? false,
    description: g.description,
    module_id: moduleIds.get(g.module)
  }));

  await knex.withSchema('rbac').table('grants').insert(inserts);
}
