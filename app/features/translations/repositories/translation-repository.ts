import { Language } from '@api-messages/api-messages';
import { ReadOnlyRepository } from '@core/repositories/base-repository';
import TranslationSchema from '../schemas/translation-schema';

export interface TranslationRepository extends ReadOnlyRepository<TranslationSchema> {
  findTranslationByCodeAndLanguage(code: string, language: Language): Promise<TranslationSchema>;
}
