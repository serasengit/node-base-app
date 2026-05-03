/**
 * @summary Language
 * @description Enum where we define all languages handled by the server
 */
export enum Language {
  English = 'en',
  Spanish = 'es'
}

/**
 * @summary APICode
 * @description API code list that is returned by the server
 */
export enum APICode {
  InternalServerError = 'internal_server_error',
  ServerErrorNotImplemented = 'server_error_not_implemented',
  ClientErrorUnprocessableEntity = 'client_error_unprocessable_entity',
  MalformedRequest = 'malformed_request',
  NoResultsFound = 'no_results_found',
  InvalidParameter = 'invalid_parameter',
  RequiredToken = 'required_token',
  UnknownError = 'unknown_error',
  RequiredParameter = 'required_parameter',
  CityNotFound = 'city_not_found',
  CityAlreadyExists = 'city_already_exists',
  MeteoStationNotFound = 'meteo_station_not_found',
  MeteoStationAlreadyExists = 'meteo_station_already_exists',
  TranslationNotFound = 'translation_not_found'
}

/**
 * @summary APIMessage
 * @description Interface where we define the message translations of each API code
 */
export type APIMessage = {
  [code in APICode]: { [Language.English]: string; [Language.Spanish]: string };
};
