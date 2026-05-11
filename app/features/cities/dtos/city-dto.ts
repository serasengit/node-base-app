import CitySchema from '@features/cities/schemas/city-schema';
import { MeteoStationDTO } from '@features/meteo-stations/dtos/meteo-station-dto';
import { UserDTO } from '@features/users/dtos/user-dto';

export class CityDTO {
  id: number;
  name: string;
  province?: string;
  country: string;
  createdById?: number;
  updatedById?: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Relations
  meteoStations?: MeteoStationDTO[];
  createdBy?: UserDTO;
  updatedBy?: UserDTO;
  /**
   * Maps a CityDTO into its persistence schema representation.
   */
  static toSchema(city: CityDTO): CitySchema {
    const citySchema = new CitySchema();

    citySchema.id = city.id;
    citySchema.name = city.name;
    citySchema.province = city.province;
    citySchema.country = city.country;
    citySchema.createdById = city.createdById;
    citySchema.updatedById = city.updatedById;
    citySchema.createdAt = city.createdAt;
    citySchema.updatedAt = city.updatedAt;

    if (city.meteoStations) {
      citySchema.meteoStations = city.meteoStations.map((meteoStation) => MeteoStationDTO.toSchema(meteoStation));
    }

    return citySchema;
  }
}
