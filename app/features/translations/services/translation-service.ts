import { APICode, Language } from '@api-messages/api-messages';
import { InternalServerError } from '@api-messages/errors/internal-server-error';
import logger from '@logger/logger';
import { Inject, Service } from 'typedi';
import { TranslationRepository } from '../repositories/translation-repository';
import TranslationSchema from '../schemas/translation-schema';

@Service()
class TranslationService {
  @Inject('translationRepository') private readonly translationRepository!: TranslationRepository;

  /**
   * @summary Retrieves the translation text for a given code and language.
   */
  public async findTranslationTextByCodeAndLanguage(code: string, language: Language = Language.Spanish): Promise<string> {
    try {
      // Retrieve the translation text
      const translationSchema: TranslationSchema = await this.translationRepository.findTranslationByCodeAndLanguage(code, language);
      // Throw an error if the translation does not exist
      if (!translationSchema) throw new InternalServerError(APICode.TranslationNotFound);
      // Return the translation text
      return translationSchema.text;
    } catch (error) {
      logger.error(
        `Error in TranslationService.findTranslationTextByCodeAndLanguage: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      logger.warn(`Could not get translation of code: ${code} for language: ${language}`);
      throw error;
    }
  }
}

export default TranslationService;
