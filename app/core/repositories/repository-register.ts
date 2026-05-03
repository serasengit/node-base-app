import { TranslationRepositoryImpl } from '@features/translations/repositories/translation-repository-impl';
import Container from 'typedi';
import { MeteoStationRepositoryImpl } from '../../features/meteo-stations/repositories/meteo-station-repository-impl';

export class RepositoryRegister {
  static register(): void {
    // Translation
    Container.set('translationRepository', new TranslationRepositoryImpl());
    // MeteoStation
    Container.set('meteoStationRepository', new MeteoStationRepositoryImpl());
  }
}
