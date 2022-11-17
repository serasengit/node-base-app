import { Service } from 'typedi';
import { MeteoStationDTO } from '@dtos/meteo-station-dto';
import MeteoStationRepositoryImpl from '@repositories/meteo-station/meteo-station-repository-impl';
import { MeteoStationSchema } from '@schemas/meteo-station-schema';
import { NotFoundError } from '@api-messages/errors/not-found-error';
import { APICode } from '@api-messages/api-messages';
import { MeteoStationMapper } from '@mappers/meteo-station-mapper';

@Service()
class MeteoStationService {
  constructor(
    private readonly meteoStationRepository: MeteoStationRepositoryImpl,
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
      const meteoStationsSchema: MeteoStationSchema[] = await this.meteoStationRepository.findAll();
      return meteoStationsSchema as MeteoStationDTO[];
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
