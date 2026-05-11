import { Knex } from 'knex';

interface GrantPermissions {
  moduleCode: string;
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface RoleGrants {
  roleCode: string;
  grants: GrantPermissions[];
}

export async function seed(knex: Knex): Promise<void> {
  // Define all roles and their grants
  const rolesGrants: RoleGrants[] = [
    {
      roleCode: 'read_only',
      grants: [
        { moduleCode: 'users', canRead: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleCode: 'cities', canRead: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleCode: 'meteo_stations', canRead: true, canCreate: false, canEdit: false, canDelete: false }
      ]
    }
  ];

  // Insert role grants
  await knex.transaction(async (trx) => {
    await trx.withSchema('rbac').table('role_grants').del();

    for (const role of rolesGrants) {
      const roleRow = await trx.withSchema('rbac').table('roles').select('id').where('code', role.roleCode).first();
      if (!roleRow) throw new Error(`Role not found: ${role.roleCode}`);

      for (const grant of role.grants) {
        const moduleRow = await trx.withSchema('rbac').table('modules').select('id').where('code', grant.moduleCode).first();
        if (!moduleRow) throw new Error(`Module not found: ${grant.moduleCode}`);

        const grantRow = await trx
          .withSchema('rbac')
          .table('grants')
          .select('id')
          .where('module_id', moduleRow.id)
          .andWhere('can_read', grant.canRead)
          .andWhere('can_create', grant.canCreate)
          .andWhere('can_edit', grant.canEdit)
          .andWhere('can_delete', grant.canDelete)
          .first();

        if (!grantRow) {
          throw new Error(
            `Grant not found for role=${role.roleCode} module=${grant.moduleCode} perms ` +
              `R=${+grant.canRead} C=${+grant.canCreate} E=${+grant.canEdit} D=${+grant.canDelete}`
          );
        }

        await trx.withSchema('rbac').table('role_grants').insert({
          role_id: roleRow.id,
          grant_id: grantRow.id
        });
      }
    }
  });
}
