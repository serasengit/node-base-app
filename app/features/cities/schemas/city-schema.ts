import MeteoStationSchema from '@features/meteo-stations/schemas/meteo-station-schema';
import { JSONSchema, Model, RelationMappings } from 'objection';
import { CityDTO } from '../dtos/city-dto';

export default class CitySchema extends Model {
  id!: number;
  name!: string;
  province?: string;
  country!: string;
  createdAt!: Date;
  updatedAt!: Date;
  // Relations
  meteoStations?: MeteoStationSchema[];

  static readonly tableName = 'cities';

  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

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

  static get relationMappings(): RelationMappings {
    return {
      meteoStations: {
        relation: Model.HasManyRelation,
        modelClass: MeteoStationSchema,
        join: {
          from: 'cities.id',
          to: 'meteoStations.cityId'
        }
      }
    };
  }

  static toDTO(citySchema: CitySchema): CityDTO {
    const city: CityDTO = {
      id: citySchema.id,
      name: citySchema.name,
      province: citySchema.province,
      country: citySchema.country,
      createdAt: citySchema.createdAt,
      updatedAt: citySchema.updatedAt
    };
    if (citySchema.meteoStations) {
      city.meteoStations = citySchema.meteoStations.map((meteoStation) => MeteoStationSchema.toDTO(meteoStation));
    }

    return city;
  }
}
