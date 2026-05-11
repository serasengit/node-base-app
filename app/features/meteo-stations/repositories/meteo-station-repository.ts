import { QueryParams, WritableRepository } from '@core/repositories/base-repository';
import MeteoStationSchema from '@features/meteo-stations/schemas/meteo-station-schema';

export interface MeteoStationRepository extends WritableRepository<MeteoStationSchema> {
  findByName(name: string, params?: QueryParams): Promise<MeteoStationSchema>;
}
