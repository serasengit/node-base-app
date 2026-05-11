import { APICode } from '@api-messages/api-messages';
import { NotFoundError } from '@api-messages/errors/not-found-error';
import { QueryParams } from '@core/repositories/base-repository';
import { GrantType } from '@features/grants/schemas/grant-schema';
import { ModuleCode } from '@features/modules/schemas/module-schema';
import ModuleService from '@features/modules/services/module-service';
import { Inject, Service } from 'typedi';
import { RoleDTO } from '../dtos/role-dto';
import { RoleRepository } from '../repositories/role-repository';
import RoleSchema, { RoleCode } from '../schemas/role-schema';

@Service()
class RoleService {
  @Inject(() => ModuleService)
  private readonly moduleService!: ModuleService;
  @Inject('roleRepository') private readonly roleRepository!: RoleRepository;

  /**
   * @summary Retrieves a role by its ID.
   */
  public async findById(id: number, params: QueryParams = {}): Promise<RoleDTO> {
    const role = await this.roleRepository.findById(id, params);
    if (!role) throw new NotFoundError(APICode.RoleNotFound);
    return RoleSchema.toDTO(role);
  }

  /**
   * @summary Retrieves a role by its code.
   */
  public async findByCode(code: RoleCode): Promise<RoleDTO> {
    // Retrieve role by code
    const roleSchema = await this.roleRepository.findByCode(code);

    // Throw error if role is not found
    if (!roleSchema) throw new NotFoundError(APICode.RoleNotFound);

    // Convert each role schema into a DTO, preserving hierarchy
    return RoleSchema.toDTO(roleSchema);
  }

  /**
   * @summary Checks if a role has given grant type over a specific module.
   */

  public async hasGrantTypeOverModule(code: RoleCode, moduleCode: ModuleCode, grantType: GrantType): Promise<boolean> {
    // Retrieve the role
    const role = await this.findByCode(code);

    // Retrieve the module
    const module = await this.moduleService.findActiveByCode(moduleCode);

    // Check if the role has the grant over the module
    const hasGrantTypeOverModule = await this.roleRepository.hasGrantTypeOverModule(role.id, module.id, grantType);

    return hasGrantTypeOverModule;
  }
}

export default RoleService;
