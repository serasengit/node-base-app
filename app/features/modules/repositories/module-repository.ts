import ModuleSchema, { ModuleCode } from '../schemas/module-schema';

export interface ModuleRepository {
  findActiveByCode(code: ModuleCode): Promise<ModuleSchema | undefined>;
}
