import { APICode } from '@api-messages/api-messages';
import { NotFoundError } from '@api-messages/errors/not-found-error';
import { Inject, Service } from 'typedi';
import { ModuleDTO } from '../dtos/module-dto';
import { ModuleRepository } from '../repositories/module-repository';
import ModuleSchema, { ModuleCode } from '../schemas/module-schema';

@Service()
class ModuleService {
  @Inject('moduleRepository') private readonly moduleRepository!: ModuleRepository;

  /**
   * Retrieves module by its code.
   */
  public async findByCode(code: ModuleCode): Promise<ModuleDTO> {
    // Retrieve active module by code
    const moduleSchema = await this.moduleRepository.findByCode(code);

    // Throw error if module is not found
    if (!moduleSchema) throw new NotFoundError(APICode.ModuleNotFound);

    // Convert each module schema into a DTO, preserving hierarchy
    return ModuleSchema.toDTO(moduleSchema);
  }
}

export default ModuleService;
