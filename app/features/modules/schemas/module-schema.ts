import { Language } from '@api-messages/api-messages';
import GrantSchema from '@features/grants/schemas/grant-schema';
import TranslationSchema from '@features/translations/schemas/translation-schema';
import { JSONSchema, Model, RelationMappings } from 'objection';
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
  parentId?: number;
  code!: ModuleCode;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  // Relations
  parent?: ModuleSchema;
  modules?: ModuleSchema[];
  grants?: GrantSchema[];
  codeTranslation?: TranslationSchema;

  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  static readonly tableName = 'modules';

  static readonly jsonSchema: JSONSchema = {
    type: 'object',
    required: ['code'],
    properties: {
      id: { type: 'integer' },
      parentId: { type: ['integer', 'null'] },
      code: { type: 'string', minLength: 1 },
      isActive: { type: ['boolean', 'null'] },
      createdAt: { type: ['string', 'null'], format: 'date-time' },
      updatedAt: { type: ['string', 'null'], format: 'date-time' }
    }
  };

  static get relationMappings(): RelationMappings {
    return {
      parent: {
        relation: Model.BelongsToOneRelation,
        modelClass: ModuleSchema,
        join: {
          from: 'modules.parentId',
          to: 'modules.id'
        }
      },
      modules: {
        relation: Model.HasManyRelation,
        modelClass: ModuleSchema,
        join: {
          from: 'modules.id',
          to: 'modules.parentId'
        }
      },
      grants: {
        relation: Model.HasManyRelation,
        modelClass: GrantSchema,
        join: {
          from: 'modules.id',
          to: 'grants.moduleId'
        }
      },
      codeTranslation: {
        relation: Model.HasOneRelation,
        modelClass: TranslationSchema,
        join: {
          from: 'modules.code',
          to: 'translations.code'
        },
        modify: (qb): void => {
          const language = qb.context()?.language || Language.Spanish;
          qb.where('language', language);
        }
      }
    };
  }

  static toDTO(moduleSchema: ModuleSchema): ModuleDTO {
    const module: ModuleDTO = {
      id: moduleSchema.id,
      parentId: moduleSchema.parentId,
      code: moduleSchema.code,
      description: moduleSchema.codeTranslation?.text
    };
    if (moduleSchema.grants) {
      module.grants = moduleSchema.grants.map((grant) => GrantSchema.toDTO(grant));
    }
    if (moduleSchema.modules) {
      module.modules = moduleSchema.modules.map((childModule) => ModuleSchema.toDTO(childModule));
    }
    return module;
  }
}
