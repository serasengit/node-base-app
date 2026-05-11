import { ModuleDTO } from '@features/modules/dtos/module-dto';

export class GrantDTO {
  id: number;
  description: string;
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  // Relations
  module?: ModuleDTO;
}
