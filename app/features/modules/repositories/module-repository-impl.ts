import { Service } from 'typedi';
import ModuleSchema, { ModuleCode } from '../schemas/module-schema';
import { ModuleRepository } from './module-repository';

@Service('moduleRepository')
export class ModuleRepositoryImpl implements ModuleRepository {
  public async findByCode(code: ModuleCode): Promise<ModuleSchema> {
    return await ModuleSchema.query().where('code', code).first();
  }
}
