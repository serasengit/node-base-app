import { MeteoStationDTO } from '@features/meteo-stations/dtos/meteo-station-dto';
import UserSchema from '@features/users/schemas/user-schema';
import { JSONSchema, Model, RelationMappings } from 'objection';
import CitySchema from '../../cities/schemas/city-schema';

/**
 * Objection model that represents the meteo_stations table.
 */
export default class MeteoStationSchema extends Model {
  id!: number;
  name!: string;
  longitude!: number;
  latitude!: number;
  cityId!: number;
  createdById?: number;
  updatedById?: number;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  city?: CitySchema;
  createdBy?: UserSchema;
  updatedBy?: UserSchema;
  /**
   * Updates the modification timestamp before updating the record.
   */
  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  static readonly tableName = 'meteo_stations';

  /**
   * JSON schema used by Objection to validate meteo station entities.
   */
  static readonly jsonSchema: JSONSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id: {
        type: 'integer'
      },

      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },

      longitude: {
        type: ['number', 'null'],
        minimum: -180,
        maximum: 180
      },

      latitude: {
        type: ['number', 'null'],
        minimum: -90,
        maximum: 90
      },

      cityId: {
        type: ['integer', 'null']
      },
      createdById: { type: ['integer', 'null'] },
      updatedById: { type: ['integer', 'null'] },
      createdAt: {
        type: 'string',
        format: 'date-time'
      },

      updatedAt: {
        type: 'string',
        format: 'date-time'
      }
    }
  };

  /**
   * Defines model relations used by Objection.
   *
   * A meteo station belongs to one city.
   */
  static get relationMappings(): RelationMappings {
    return {
      city: {
        relation: Model.BelongsToOneRelation,
        modelClass: CitySchema,
        join: {
          from: 'meteo_stations.cityId',
          to: 'cities.id'
        }
      },
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserSchema,
        join: {
          from: 'meteo_stations.createdById',
          to: 'users.id'
        }
      },
      updatedBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserSchema,
        join: {
          from: 'meteo_stations.updatedById',
          to: 'users.id'
        }
      }
    };
  }

  /**
   * Maps a MeteoStationSchema model into its API DTO representation.
   */
  static toDTO(meteoStationSchema: MeteoStationSchema): MeteoStationDTO {
    const meteoStation: MeteoStationDTO = {
      id: meteoStationSchema.id,
      name: meteoStationSchema.name,
      longitude: meteoStationSchema.longitude,
      latitude: meteoStationSchema.latitude,
      createdById: meteoStationSchema.createdById,
      updatedById: meteoStationSchema.updatedById,
      createdAt: meteoStationSchema.createdAt,
      updatedAt: meteoStationSchema.updatedAt
    };

    // Include related city only when the relation has been loaded.
    if (meteoStationSchema.city) {
      meteoStation.city = CitySchema.toDTO(meteoStationSchema.city);
    }
    if (meteoStationSchema.createdBy) {
      meteoStation.createdBy = UserSchema.toDTO(meteoStationSchema.createdBy);
    }
    if (meteoStationSchema.updatedBy) {
      meteoStation.updatedBy = UserSchema.toDTO(meteoStationSchema.updatedBy);
    }
    return meteoStation;
  }
}
