import Container from 'typedi';
import { MeteoStationRepositoryImpl } from './meteo-station/meteo-station-repository-impl';

export class RepositoryRegister {
  static register(): void {
    // MeteoStation
    Container.set('meteoStationRepository', new MeteoStationRepositoryImpl());
  }
}
