import { GrantDTO } from '@features/grants/dtos/grant-dto';
import { ModuleCode } from '../schemas/module-schema';

export class ModuleDTO {
  id: number;
  parentId: number;
  code: ModuleCode;
  description: string;
  // Relations
  modules?: ModuleDTO[];
  grants?: Partial<GrantDTO>[];
}
