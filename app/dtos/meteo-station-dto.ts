import MeteoStationSchema from '@schemas/meteo-station-schema';
import { UserDTO } from './user-dto';

export class MeteoStationDTO {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Relations
  createdBy?: UserDTO;
  updatedBy?: UserDTO;

  static toSchema(meteoStation: MeteoStationDTO): MeteoStationSchema {
    const meteoStationSchema = new MeteoStationSchema();

    meteoStationSchema.id = meteoStation.id;
    meteoStationSchema.name = meteoStation.name;
    meteoStationSchema.longitude = meteoStation.longitude;
    meteoStationSchema.latitude = meteoStation.latitude;
    meteoStationSchema.createdAt = meteoStation.createdAt;
    meteoStationSchema.updatedAt = meteoStation.updatedAt;

    return meteoStationSchema;
  }
}
