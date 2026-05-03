import Container from 'typedi';
import { MeteoStationRepositoryImpl } from './meteo-station/meteo-station-repository-impl';

export class RepositoryRegister {
  static register(): void {
    // Please keep it in alphabetical order
    Container.set('meteoStationRepository', new MeteoStationRepositoryImpl());
  }
}
