import { Knex } from 'knex';

const METEO_STATIONS_COUNT = 100;

export async function seed(knex: Knex): Promise<void> {
  await knex('meteo_stations').del();

  const users = await knex('users').select('id').orderBy('id', 'asc');

  if (users.length === 0) {
    throw new Error('Cannot seed meteo_stations because users table is empty.');
  }

  const meteoStations = Array.from({ length: METEO_STATIONS_COUNT }, (_, index) => {
    const stationNumber = index + 1;
    const user = users[index % users.length];

    return {
      name: `Meteo Station ${stationNumber}`,
      longitude: Number((-9.5 + Math.random() * 13.5).toFixed(8)),
      latitude: Number((36.0 + Math.random() * 7.8).toFixed(8)),
      created_by_id: user.id,
      updated_by_id: user.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    };
  });

  await knex('meteo_stations').insert(meteoStations);
}
