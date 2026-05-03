import { QueryParams, WritableRepository } from '@core/repositories/base-repository';
import CitySchema from '@features/cities/schemas/city-schema';

export interface CityRepository extends WritableRepository<CitySchema> {
  findByNameCountryAndProvince(name: string, country: string, province?: string, params?: QueryParams): Promise<CitySchema | undefined>;
}
