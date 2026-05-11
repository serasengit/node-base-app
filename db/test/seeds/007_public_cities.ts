import { Knex } from 'knex';

const CITIES_COUNT = 100;

const COUNTRIES = ['Spain', 'France', 'Portugal', 'Italy', 'Germany'];
const PROVINCES = ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Bilbao', 'Malaga', 'Alicante', 'Murcia', 'Valladolid'];

export async function seed(knex: Knex): Promise<void> {
  await knex('cities').withSchema('public').del();

  const systemAdminUser = await knex.withSchema('rbac').table('users').select('id').where({ username: 'system_admin' }).first();

  const cities = Array.from({ length: CITIES_COUNT }, (_, index) => {
    const cityNumber = index + 1;

    return {
      name: `City ${cityNumber}`,
      province: PROVINCES[index % PROVINCES.length],
      country: COUNTRIES[index % COUNTRIES.length],
      created_by_id: systemAdminUser.id,
      updated_by_id: systemAdminUser.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    };
  });

  await knex('cities').withSchema('public').insert(cities);
}
