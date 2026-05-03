import { MeteoStationDTO } from '@features/meteo-stations/dtos/meteo-station-dto';
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
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  city?: CitySchema;

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
    required: ['name', 'longitude', 'latitude', 'cityId'],
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
        type: 'number',
        minimum: -180,
        maximum: 180
      },

      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90
      },

      cityId: {
        type: 'integer'
      },

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
      latitude: meteoStationSchema.latitude
    };

    // Include related city only when the relation has been loaded.
    if (meteoStationSchema.city) {
      meteoStation.city = CitySchema.toDTO(meteoStationSchema.city);
    }

    return meteoStation;
  }
}
