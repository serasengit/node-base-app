import { QueryParams, WritableRepository } from '@repositories/base-repository';
import MeteoStationSchema from '@schemas/meteo-station-schema';

export interface MeteoStationRepository extends WritableRepository<MeteoStationSchema> {
  findByName(name: string, params?: QueryParams): Promise<MeteoStationSchema | undefined>;
}
