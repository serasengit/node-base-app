import { MeteoStationSchema } from '@schemas/meteo-station-schema';

export interface MeteoStationRepository extends BaseRepository<MeteoStationSchema> {
  findById(id: number): Promise<MeteoStationSchema>;
}
