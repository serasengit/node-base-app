import MeteoStationSchema from '@features/meteo-stations/schemas/meteo-station-schema';
import UserSchema from '@features/users/schemas/user-schema';
import { JSONSchema, Model, RelationMappings } from 'objection';
import { CityDTO } from '../dtos/city-dto';

/**
 * Objection model that represents the cities table.
 */
export default class CitySchema extends Model {
  id!: number;
  name!: string;
  province?: string;
  country!: string;
  createdById?: number;
  updatedById?: number;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  meteoStations?: MeteoStationSchema[];
  createdBy?: UserSchema;
  updatedBy?: UserSchema;

  static readonly tableName = 'cities';

  /**
   * Updates the modification timestamp before updating the record.
   */
  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  /**
   * JSON schema used by Objection to validate city entities.
   */
  static readonly jsonSchema: JSONSchema = {
    type: 'object',
    required: ['name', 'country'],
    properties: {
      id: {
        type: 'integer'
      },

      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },

      province: {
        type: ['string', 'null'],
        maxLength: 100
      },

      country: {
        type: 'string',
        minLength: 1,
        maxLength: 100
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
   * A city can have many meteo stations.
   */
  static get relationMappings(): RelationMappings {
    return {
      meteoStations: {
        relation: Model.HasManyRelation,
        modelClass: MeteoStationSchema,
        join: {
          from: 'cities.id',
          to: 'meteo_stations.cityId'
        }
      },
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserSchema,
        join: {
          from: 'cities.createdById',
          to: 'users.id'
        }
      },
      updatedBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserSchema,
        join: {
          from: 'cities.updatedById',
          to: 'users.id'
        }
      }
    };
  }

  /**
   * Maps a CitySchema model into its API DTO representation.
   */
  static toDTO(citySchema: CitySchema): CityDTO {
    const city: CityDTO = {
      id: citySchema.id,
      name: citySchema.name,
      province: citySchema.province,
      country: citySchema.country,
      createdById: citySchema.createdById,
      updatedById: citySchema.updatedById,
      createdAt: citySchema.createdAt,
      updatedAt: citySchema.updatedAt
    };

    // Include related meteo stations only when the relation has been loaded.
    if (citySchema.meteoStations) {
      city.meteoStations = citySchema.meteoStations.map((meteoStation) => MeteoStationSchema.toDTO(meteoStation));
    }
    if (citySchema.createdBy) {
      city.createdBy = UserSchema.toDTO(citySchema.createdBy);
    }
    if (citySchema.updatedBy) {
      city.updatedBy = UserSchema.toDTO(citySchema.updatedBy);
    }

    return city;
  }
}
