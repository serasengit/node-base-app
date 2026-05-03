import { APICode, Language } from '@api-messages/api-messages';
import { InternalServerError } from '@api-messages/errors/internal-server-error';
import { initializeApplicationContext } from '@bootstrap/application-context';
import { TranslationRepositoryImpl } from '@features/translations/repositories/translation-repository-impl';
import TranslationSchema from '@features/translations/schemas/translation-schema';
import TranslationService from '@features/translations/services/translation-service';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import Container from 'typedi';

describe('Translations Feature', function () {
  before(() => {
    initializeApplicationContext();
  });

  describe('TranslationRepositoryImpl', () => {
    it('should find a translation by code and language', async () => {
      const repository = Container.get<TranslationRepositoryImpl>('translationRepository');

      const translation = await repository.findTranslationByCodeAndLanguage(APICode.InternalServerError, Language.English);

      expect(translation).to.not.equal(undefined);
      expect(translation.code).to.equal(APICode.InternalServerError);
      expect(translation.language).to.equal(Language.English);
      expect(translation.text).to.equal('Internal server error');
    });

    it('should default to spanish language when omitted', async () => {
      const repository = Container.get<TranslationRepositoryImpl>('translationRepository');

      const translation = await repository.findTranslationByCodeAndLanguage(APICode.MeteoStationNotFound);

      expect(translation).to.not.equal(undefined);
      expect(translation.code).to.equal(APICode.MeteoStationNotFound);
      expect(translation.language).to.equal(Language.Spanish);
    });
  });

  describe('TranslationService', () => {
    it('should return translated text by code and language', async () => {
      const service = Container.get(TranslationService);

      const text = await service.findTranslationTextByCodeAndLanguage(APICode.MeteoStationAlreadyExists, Language.English);

      expect(text).to.equal('Meteorological station already exists');
    });

    it('should throw InternalServerError when translation does not exist', async () => {
      const service = Container.get(TranslationService);

      try {
        await service.findTranslationTextByCodeAndLanguage('missing_translation_code', Language.English);
        expect.fail('Expected missing translation to throw');
      } catch (error) {
        expect(error).to.be.instanceOf(InternalServerError);
        expect(error).to.have.property('code', APICode.TranslationNotFound);
      }
    });
  });

  describe('TranslationSchema', () => {
    it('should expose the expected table name and json schema', () => {
      expect(TranslationSchema.tableName).to.equal('translations');
      expect(TranslationSchema.jsonSchema).to.deep.include({
        type: 'object'
      });
      expect(TranslationSchema.jsonSchema.required).to.deep.equal(['code', 'language', 'text']);
      expect(TranslationSchema.jsonSchema.properties).to.have.property('code');
      expect(TranslationSchema.jsonSchema.properties).to.have.property('language');
      expect(TranslationSchema.jsonSchema.properties).to.have.property('text');
    });

    it('should refresh updatedAt in $beforeUpdate', () => {
      const schema = new TranslationSchema();
      const before = schema.updatedAt;

      schema.$beforeUpdate();

      expect(schema.updatedAt).to.be.instanceOf(Date);
      expect(schema.updatedAt).to.not.equal(before);
    });
  });
});
