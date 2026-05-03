import { JSONSchema, Model } from 'objection';

export default class TranslationSchema extends Model {
  id!: number;
  code!: string;
  language!: string;
  text!: string;
  createdAt!: Date;
  updatedAt!: Date;

  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }
  static readonly tableName = 'translations';

  static readonly jsonSchema: JSONSchema = {
    type: 'object',
    required: ['code', 'language', 'text'],
    properties: {
      id: { type: 'integer' },
      code: { type: 'string', minLength: 1 },
      language: { type: 'string', minLength: 2, maxLength: 5 },
      text: { type: 'string', minLength: 1 },
      createdAt: { type: ['string', 'null'], format: 'date-time' },
      updatedAt: { type: ['string', 'null'], format: 'date-time' }
    }
  };
}
