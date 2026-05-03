import { MeteoStationDTO } from '@features/meteo-stations/dtos/meteo-station-dto';
import { JSONSchema, Model, RelationMappings } from 'objection';
import { default as CitySchema } from '../../cities/schemas/city-schema';

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

      cityId: {
        type: 'integer'
      }
    }
  };

  static get relationMappings(): RelationMappings {
    return {
      city: {
        relation: Model.BelongsToOneRelation,
        modelClass: CitySchema,
        join: {
          from: 'meteoStations.cityId',
          to: 'cities.id'
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
    if (meteoStationSchema.city) meteoStation.city = CitySchema.toDTO(meteoStationSchema.city);
    return meteoStation;
  }
}
