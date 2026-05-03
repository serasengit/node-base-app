import { APICode } from '@api-messages/api-messages';
import { ConflictError } from '@api-messages/errors/conflict-error';
import { NotFoundError } from '@api-messages/errors/not-found-error';
import { QueryParams, QueryResponse } from '@core/repositories/base-repository';
import { CityDTO } from '@features/cities/dtos/city-dto';
import { CityRepository } from '@features/cities/repositories/city-repository';
import CitySchema from '@features/cities/schemas/city-schema';
import logger from '@logger/logger';
import { transaction } from 'objection';
import { Inject, Service } from 'typedi';

@Service()
class CityService {
  constructor(@Inject('cityRepository') private readonly cityRepository: CityRepository) {}

  /**
   * @summary Retrieves cities based on provided query parameters.
   */
  public async find(params: QueryParams): Promise<QueryResponse<CityDTO>> {
    // Retrieve city records from the repository
    const { total, records }: QueryResponse<CitySchema> = await this.cityRepository.find(params);

    // Convert the city schemas to DTOs and return
    return { total, records: records.map(CitySchema.toDTO) };
  }

  /**
   * @summary Retrieves a city by its ID.
   */
  public async findById(id: number, params: QueryParams = {}): Promise<CityDTO> {
    const citySchema = await this.cityRepository.findById(id, params);
    if (!citySchema) throw new NotFoundError(APICode.CityNotFound);
    return CitySchema.toDTO(citySchema);
  }

  /**
   * @summary Creates a new city.
   */
  public async create(city: CityDTO): Promise<CityDTO> {
    const trx = await transaction.start(CitySchema.knex());

    try {
      // Convert the city DTO to a city schema
      const citySchema = CityDTO.toSchema(city);

      // Ensure city does not already exist using its unique composite key
      const exists = await this.cityRepository.exists(citySchema, trx);

      if (exists.name || exists.country || exists.province) {
        throw new ConflictError(APICode.CityAlreadyExists, { details: this.cityIdentity(city) });
      }

      // Create city with cascade to also create/update related meteo stations if provided
      const createdCitySchema = await this.cityRepository.save(trx, citySchema, true);

      // Commit
      await trx.commit();

      // Return created city
      return CitySchema.toDTO(createdCitySchema);
    } catch (error) {
      logger.error(
        `Error in CityService.create: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      await trx.rollback();
      throw error;
    }
  }

  /**
   * @summary Updates an existing city.
   */
  public async update(city: CityDTO): Promise<CityDTO> {
    const trx = await transaction.start(CitySchema.knex());

    try {
      // Convert the city DTO to a city schema
      const citySchema = CityDTO.toSchema(city);
      const exists = await this.cityRepository.exists(citySchema, trx);

      // Ensure city exists
      if (!exists.id) throw new NotFoundError(APICode.CityNotFound);

      // Ensure another city does not already use the same composite key
      if (exists.name || exists.country || exists.province) {
        throw new ConflictError(APICode.CityAlreadyExists, { details: this.cityIdentity(city) });
      }

      // Update city with cascade to also create/update related meteo stations if provided
      const updatedCitySchema = await this.cityRepository.update(trx, citySchema, true);

      // Commit
      await trx.commit();

      // Return updated city
      return CitySchema.toDTO(updatedCitySchema);
    } catch (error) {
      logger.error(
        `Error in CityService.update: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      await trx.rollback();
      throw error;
    }
  }

  /**
   * @summary Deletes a city by its ID.
   */
  public async delete(id: number): Promise<void> {
    const trx = await transaction.start(CitySchema.knex());

    try {
      // Ensure city exists
      const citySchema = await this.cityRepository.findById(id, { trx });
      if (!citySchema) throw new NotFoundError(APICode.CityNotFound);

      // Delete city
      await this.cityRepository.delete(trx, citySchema);

      // Commit
      await trx.commit();
    } catch (error) {
      logger.error(
        `Error in CityService.delete: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      await trx.rollback();
      throw error;
    }
  }

  /**
   * @summary Builds a readable city identity for conflict details.
   */
  private cityIdentity(city: CityDTO): string {
    return [city.name, city.province, city.country].filter(Boolean).join(', ');
  }
}

export default CityService;
