import { JSONSchema, Model } from 'objection';
import { ModuleDTO } from '../dtos/module-dto';

export enum ModuleCode {
  Home = 'home',
  Users = 'users',
  Roles = 'roles',
  Grants = 'grants',
  Cities = 'cities',
  MeteoStations = 'meteo_stations'
}

export default class ModuleSchema extends Model {
  id!: number;
  code!: ModuleCode;
  createdAt!: Date;
  updatedAt!: Date;

  static readonly tableName = 'modules';

  static readonly jsonSchema: JSONSchema = {
    type: 'object',
    required: ['code'],
    properties: {
      id: { type: 'integer' },
      code: { type: 'string', minLength: 1, maxLength: 100 },
      createdAt: { type: ['string', 'null'], format: 'date-time' },
      updatedAt: { type: ['string', 'null'], format: 'date-time' }
    }
  };

  static toDTO(moduleSchema: ModuleSchema): ModuleDTO {
    const module: ModuleDTO = {
      id: moduleSchema.id,
      code: moduleSchema.code
    };
    return module;
  }
}
