import { APICode } from '@api-messages/api-messages';
import { ConflictError } from '@api-messages/errors/conflict-error';
import { NotFoundError } from '@api-messages/errors/not-found-error';
import { QueryParams, QueryResponse } from '@core/repositories/base-repository';
import { MeteoStationDTO } from '@features/meteo-stations/dtos/meteo-station-dto';
import { MeteoStationRepository } from '@features/meteo-stations/repositories/meteo-station-repository';
import MeteoStationSchema from '@features/meteo-stations/schemas/meteo-station-schema';
import logger from 'logger/logger';
import { transaction } from 'objection';
import { Inject, Service } from 'typedi';

@Service()
class MeteoStationService {
  @Inject('meteoStationRepository') private readonly meteoStationRepository: MeteoStationRepository;

  /**
   * Retrieves meteo stations based on provided query parameters.
   */
  public async find(params: QueryParams): Promise<QueryResponse<MeteoStationDTO>> {
    // Retrieve meteo station records from the repository
    const { total, records }: QueryResponse<MeteoStationSchema> = await this.meteoStationRepository.find(params);

    // Convert the meteo station records to DTOs and return the response
    return { total, records: records.map(MeteoStationSchema.toDTO) };
  }

  /**
   * Retrieves a meteo station by its ID.
   */
  public async findById(id: number, params: QueryParams = {}): Promise<MeteoStationDTO> {
    const meteoStationSchema = await this.meteoStationRepository.findById(id, params);
    if (!meteoStationSchema) throw new NotFoundError(APICode.MeteoStationNotFound);
    return MeteoStationSchema.toDTO(meteoStationSchema);
  }

  /**
   * Creates a new meteo station.
   */
  public async create(meteoStation: MeteoStationDTO, authenticatedUserId: number): Promise<MeteoStationDTO> {
    const trx = await transaction.start(MeteoStationSchema.knex());

    try {
      // Convert the master table DTO to a master table schema
      const meteoStationSchema = MeteoStationDTO.toSchema(meteoStation);
      meteoStationSchema.createdById = authenticatedUserId;
      meteoStationSchema.updatedById = authenticatedUserId;

      // Ensure meteo does not already exist
      const exists = await this.meteoStationRepository.exists(meteoStationSchema, trx);
      if (!!exists['name']) throw new ConflictError(APICode.MeteoStationAlreadyExists, { details: meteoStation.name });

      // Create meteo station
      const createdMeteoStationSchema = await this.meteoStationRepository.save(trx, meteoStationSchema);

      // Commit
      await trx.commit();

      // Return created meteo station
      return MeteoStationSchema.toDTO(createdMeteoStationSchema);
    } catch (error) {
      logger.error(
        `Error in MeteoStationService.create: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Updates a new meteo station.
   */
  public async update(meteoStation: MeteoStationDTO, authenticatedUserId: number): Promise<MeteoStationDTO> {
    const trx = await transaction.start(MeteoStationSchema.knex());

    try {
      // Convert the master table DTO to a master table schema
      const meteoStationSchema = MeteoStationDTO.toSchema(meteoStation);
      meteoStationSchema.updatedById = authenticatedUserId;

      // Ensure meteo station exists
      const exists = await this.meteoStationRepository.exists(meteoStationSchema, trx);
      if (!exists['id']) throw new NotFoundError(APICode.MeteoStationNotFound);
      // Ensure meteo station name does not already exist for another record
      if (!!exists['name']) throw new ConflictError(APICode.MeteoStationAlreadyExists, { details: meteoStation.name });

      // Update meteo station
      const updatedMeteoStationSchema = await this.meteoStationRepository.update(trx, meteoStationSchema);

      // Commit
      await trx.commit();

      // Return updated meteo station
      return MeteoStationSchema.toDTO(updatedMeteoStationSchema);
    } catch (error) {
      logger.error(
        `Error in MeteoStationService.update: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Deletes a meteo station by its ID.
   */
  public async delete(id: number): Promise<void> {
    const trx = await transaction.start(MeteoStationSchema.knex());

    try {
      // Ensure meteo station exists
      const meteoStationSchema = await this.meteoStationRepository.findById(id, { trx });
      if (!meteoStationSchema) throw new NotFoundError(APICode.MeteoStationNotFound);

      // Delete meteo station
      await this.meteoStationRepository.delete(trx, meteoStationSchema);

      // Commit
      await trx.commit();
    } catch (error) {
      logger.error(
        `Error in MeteoStationService.delete: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      await trx.rollback();
      throw error;
    }
  }
}

export default MeteoStationService;
