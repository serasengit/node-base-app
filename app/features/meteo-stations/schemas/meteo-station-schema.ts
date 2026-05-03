import { MeteoStationDTO } from '@features/meteo-stations/dtos/meteo-station-dto';
import { JSONSchema, Model, RelationMappings } from 'objection';
import UserSchema from '../../users/schemas/user-schema';

export default class MeteoStationSchema extends Model {
  id!: number;
  name!: string;
  longitude!: number;
  latitude!: number;
  createdById!: number;
  updatedById!: number;
  createdAt!: Date;
  updatedAt!: Date;
  // Relations
  createdBy?: UserSchema;
  updatedBy?: UserSchema;

  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  static readonly tableName = 'meteoStations';

  static readonly jsonSchema: JSONSchema = {
    type: 'object',
    required: ['name', 'longitude', 'latitude'],
    properties: {
      id: { type: 'integer' },

      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },

      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180
      },

      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90
      },

      createdAt: {
        type: 'string',
        format: 'date-time'
      },

      updatedAt: {
        type: 'string',
        format: 'date-time'
      },

      createdById: {
        type: 'integer'
      },

      updatedById: {
        type: 'integer'
      }
    }
  };

  static get relationMappings(): RelationMappings {
    return {
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserSchema,
        join: {
          from: 'meteoStations.createdById',
          to: 'users.id'
        }
      },
      updatedBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserSchema,
        join: {
          from: 'meteoStations.updatedById',
          to: 'users.id'
        }
      }
    };
  }

  static toDTO(meteoStationSchema: MeteoStationSchema): MeteoStationDTO {
    const meteoStation: MeteoStationDTO = {
      id: meteoStationSchema.id,
      name: meteoStationSchema.name,
      longitude: meteoStationSchema.longitude,
      latitude: meteoStationSchema.latitude
    };
    if (meteoStationSchema.createdBy) meteoStation.createdBy = UserSchema.toDTO(meteoStationSchema.createdBy);
    if (meteoStationSchema.updatedBy) meteoStation.updatedBy = UserSchema.toDTO(meteoStationSchema.updatedBy);
    return meteoStation;
  }
}
