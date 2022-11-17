import { MeteoStationDTO } from '@dtos/meteo-station-dto';
import { MeteoStationSchema } from '@schemas/meteo-station-schema';
import { Service } from 'typedi';
import { BaseMapper } from './base-mapper';

@Service()
export class MeteoStationMapper extends BaseMapper<MeteoStationSchema, MeteoStationDTO> {
  constructor() {
    super();
  }
  toSchema(meteoStationDTO: MeteoStationDTO): MeteoStationSchema {
    return <MeteoStationSchema>{
      id: meteoStationDTO.id,
      name: meteoStationDTO.name,
      longitude: meteoStationDTO.longitude,
      latitude: meteoStationDTO.latitude
    };
  }

  toDTO(meteoStationSchema: MeteoStationSchema): MeteoStationDTO {
    return <MeteoStationDTO>{
      id: meteoStationSchema.id,
      name: meteoStationSchema.name,
      longitude: meteoStationSchema.longitude,
      latitude: meteoStationSchema.latitude
    };
  }
}
