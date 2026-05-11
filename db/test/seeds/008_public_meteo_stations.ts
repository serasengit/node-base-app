import { Knex } from 'knex';

const METEO_STATIONS_COUNT = 100;

export async function seed(knex: Knex): Promise<void> {
  await knex('meteo_stations').withSchema('public').del();

  const cities = await knex('cities').select('id').orderBy('id', 'asc');

  if (cities.length === 0) {
    throw new Error('Cannot seed meteo_stations because cities table is empty.');
  }
  const systemAdminUser = await knex.withSchema('rbac').table('users').select('id').where({ username: 'system_admin' }).first();

  const meteoStations = Array.from({ length: METEO_STATIONS_COUNT }, (_, index) => {
    const stationNumber = index + 1;
    const city = cities[index % cities.length];

    return {
      name: `Meteo Station ${stationNumber}`,
      longitude: Number((-9.5 + Math.random() * 13.5).toFixed(8)),
      latitude: Number((36.0 + Math.random() * 7.8).toFixed(8)),
      city_id: city.id,
      created_by_id: systemAdminUser.id,
      updated_by_id: systemAdminUser.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    };
  });

  await knex('meteo_stations').withSchema('public').insert(meteoStations);
}
