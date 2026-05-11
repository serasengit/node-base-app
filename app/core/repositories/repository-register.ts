import { CityRepositoryImpl } from '@features/cities/repositories/city-repository-impl';
import { ModuleRepositoryImpl } from '@features/modules/repositories/module-repository-impl';
import { RoleRepositoryImpl } from '@features/roles/repositories/role-repository-impl';
import { TranslationRepositoryImpl } from '@features/translations/repositories/translation-repository-impl';
import { UserRepositoryImpl } from '@features/users/repositories/user-repository-impl';
import Container from 'typedi';
import { MeteoStationRepositoryImpl } from '../../features/meteo-stations/repositories/meteo-station-repository-impl';

export class RepositoryRegister {
  static register(): void {
    // Translations
    Container.set('translationRepository', new TranslationRepositoryImpl());
    // Modules
    Container.set('moduleRepository', new ModuleRepositoryImpl());
    // Roles
    Container.set('roleRepository', new RoleRepositoryImpl());
    // Users
    Container.set('userRepository', new UserRepositoryImpl());
    // Cities
    Container.set('cityRepository', new CityRepositoryImpl());
    // MeteoStations
    Container.set('meteoStationRepository', new MeteoStationRepositoryImpl());
  }
}
