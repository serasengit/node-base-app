import { APICode } from '@api-messages/api-messages';
import { NotFoundError } from '@api-messages/errors/not-found-error';
import { MeteoStationDTO } from '@dtos/meteo-station-dto';
import { MeteoStationMapper } from '@mappers/meteo-station-mapper';
import { MeteoStationRepository } from '@repositories/meteo-station/meteo-station-repository';
import { MeteoStationSchema } from '@schemas/meteo-station-schema';
import { Inject, Service } from 'typedi';

@Service()
class MeteoStationService {
  constructor(
    @Inject('meteoStationRepository') private readonly meteoStationRepository: MeteoStationRepository,
    private readonly meteoStationMapper: MeteoStationMapper
  ) {}

  /**
   * @summary Find all meteo stations
   * @description Find all meteo stations
   * @returns Promise<MeteoStationDTO[]>
   *
   */
  public async findAll(): Promise<MeteoStationDTO[]> {
    try {
      const meteoStationsSchemas: MeteoStationSchema[] = await this.meteoStationRepository.findAll();
      return meteoStationsSchemas.map((meteoStationsSchema) => this.meteoStationMapper.toDTO(meteoStationsSchema));
    } catch (err) {
      throw err;
    }
  }

  /**
   * @summary Find  meteo station by id
   * @description Find  meteo station by id
   * @param {number | string} id meteo station id
   * @returns Promise<MeteoStationDTO>
   *
   */
  public async findById(id: number | string): Promise<MeteoStationDTO> {
    try {
      const meteoStationSchema: MeteoStationSchema = await this.meteoStationRepository.findById(id);
      if (!meteoStationSchema) throw new NotFoundError(APICode.MeteoStationNotFound);
      return this.meteoStationMapper.toDTO(meteoStationSchema);
    } catch (err) {
      throw err;
    }
  }
}
export default MeteoStationService;
