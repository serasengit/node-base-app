import { CityDTO } from '@features/cities/dtos/city-dto';
import MeteoStationSchema from '@features/meteo-stations/schemas/meteo-station-schema';

export class MeteoStationDTO {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Relations
  city?: CityDTO;

  /**
   * Maps a MeteoStationDTO into its persistence schema representation.
   */
  static toSchema(meteoStation: MeteoStationDTO): MeteoStationSchema {
    const meteoStationSchema = new MeteoStationSchema();

    meteoStationSchema.id = meteoStation.id;
    meteoStationSchema.name = meteoStation.name;
    meteoStationSchema.longitude = meteoStation.longitude;
    meteoStationSchema.latitude = meteoStation.latitude;
    meteoStationSchema.createdAt = meteoStation.createdAt;
    meteoStationSchema.updatedAt = meteoStation.updatedAt;

    if (meteoStation.city) meteoStationSchema.city = CityDTO.toSchema(meteoStation.city);

    return meteoStationSchema;
  }
}
