import ModuleSchema, { ModuleCode } from '../schemas/module-schema';

export interface ModuleRepository {
  findByCode(code: ModuleCode): Promise<ModuleSchema>;
}
