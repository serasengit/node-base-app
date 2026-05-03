import { Language } from '@api-messages/api-messages';
import { NotImplementedMethodError } from '@api-messages/errors/non-implemented-method-error';

import { QueryParams, QueryResponse } from '@core/repositories/base-repository';
import { Service } from 'typedi';
import TranslationSchema from '../schemas/translation-schema';
import { TranslationRepository } from './translation-repository';

@Service('translationRepository')
export class TranslationRepositoryImpl implements TranslationRepository {
  /**
   * Checks whether a translation already exists.
   *
   * This method is not implemented because translations are resolved by code and language.
   */

  /* istanbul ignore next */
  async exists(_translationSchema: TranslationSchema): Promise<Record<string, boolean>> {
    void _translationSchema;

    throw new NotImplementedMethodError();
  }

  /**
   * Finds a translation by its primary key.
   *
   * This method is not implemented because translations are resolved by code and language.
   */

  /* istanbul ignore next */
  async findById(_id: number): Promise<TranslationSchema> {
    void _id;

    throw new NotImplementedMethodError();
  }

  /**
   * Finds translations using generic query parameters.
   *
   * This method is not implemented because the current use case only requires
   * retrieving a single translation by code and language.
   */

  /* istanbul ignore next */
  find(_params: QueryParams): Promise<QueryResponse<TranslationSchema>> {
    void _params;

    throw new NotImplementedMethodError();
  }

  /**
   * Finds a translation by API/message code and language.
   *
   * Spanish is used as the default language when none is provided.
   */
  async findTranslationByCodeAndLanguage(code: string, language: Language = Language.Spanish): Promise<TranslationSchema> {
    // Retrieve the first translation matching the requested code and language.
    const translation: TranslationSchema = await TranslationSchema.query().where('code', code).andWhere('language', language).first();

    return translation;
  }
}
