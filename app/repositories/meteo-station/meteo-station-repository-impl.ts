import { Service } from 'typedi';
import { MeteoStationRepository } from './meteo-station-repository';
import { MeteoStationSchema } from '@schemas/meteo-station-schema';
import { NotImplementedMethodError } from '@api-messages/errors/non-implemented-method-error';

@Service()
class MeteoStationRepositoryImpl implements MeteoStationRepository {
  public async exists(meteoStationSchema: MeteoStationSchema): Promise<boolean> {
    console.log(`Check meteo station ${meteoStationSchema}`);
    throw new NotImplementedMethodError();
  }

  public async findAll(): Promise<MeteoStationSchema[]> {
    console.log(`Find all meteo stations`);
    // Note: Mock  SQL response because we do not have BBDD credentials (Just tables scripts where sent in this app test)
    return [
      { id: 1, name: 'Meteo 1', longitude: 41.646749, latitude: -0.586661 },
      { id: 2, name: 'Meteo 2', longitude: 40.168905, latitude: -2.826892 },
      { id: 3, name: 'Meteo 3', longitude: 41.794352, latitude: -6.34098 },
      { id: 4, name: 'Meteo 4', longitude: 41.974296, latitude: 2.026942 }
    ];
  }

  public async findById(id: string | number): Promise<MeteoStationSchema> {
    console.log(`Find meteo station ${id}`);
    // Note: Mock  SQL response because we do not have BBDD credentials (Just tables scripts where sent in this app test)
    return { id: 1, name: 'Meteo 1', longitude: 41.646749, latitude: -0.586661 };
  }

  public async save(meteoStationSchema: MeteoStationSchema): Promise<MeteoStationSchema> {
    console.log(`Save meteo station ${meteoStationSchema}`);
    throw new NotImplementedMethodError();
  }

  public async delete(meteoStationSchema: MeteoStationSchema): Promise<MeteoStationSchema> {
    console.log(`Delete meteo station ${meteoStationSchema}`);
    throw new NotImplementedMethodError();
  }

  public async update(meteoStationSchema: MeteoStationSchema): Promise<MeteoStationSchema> {
    console.log(`Update meteo station ${meteoStationSchema}`);
    throw new NotImplementedMethodError();
  }
}

export default MeteoStationRepositoryImpl;
