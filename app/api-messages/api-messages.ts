/**
 * @summary Language
 * @description Enum where we define all languages handled by the server
 *
 */
export enum Language {
  English = 'en',
  Spanish = 'es'
}

/**
 * @summary APICode
 * @description API code list that is returned by the server
 *
 */
export enum APICode {
  InternalServerError = 'internal_server_error',
  ServerErrorNotImplemented = 'server_error_not_implemented',
  ClientErrorUnprocessableEntity = 'client_error_unprocessable_entity',
  NoResultsFound = 'no_results_found',
  InvalidParameter = 'invalid_parameter',
  MeteoStationNotFound = 'meteo_station_not_found'
}

/**
 * @summary APIMessage
 * @description Interface where we define the message translations of each API code
 *
 */
export type APIMessage = {
  [code in APICode]: { [Language.English]: string; [Language.Spanish]: string };
};

/**
 * @summary getAPIMessage
 * @description Retrieve API message through APICode and request language sent as parameters
 *
 */

export function getAPIMessage(code: APICode, language: Language = Language.English): string {
  return API_MESSAGES[code][language];
}

/**
 * @summary API_MESSAGES
 * @description List of API messages returned by the server
 *
 */

export const API_MESSAGES: {
  [code in APICode]: { [Language.English]: string; [Language.Spanish]: string };
} = {
  [APICode.InternalServerError]: {
    [Language.Spanish]: 'Error interno del servidor',
    [Language.English]: 'Internal server error'
  },
  [APICode.ServerErrorNotImplemented]: {
    [Language.Spanish]: 'El servidor no admite la funcionalidad requerida para cumplir con la solicitud',
    [Language.English]: 'Server does not support the functionality required to fulfill the request'
  },
  [APICode.ClientErrorUnprocessableEntity]: {
    [Language.Spanish]: 'Ha ocurrido un error al procesar el cuerpo de la petición',
    [Language.English]: 'An error occurred while processing the request body'
  },
  [APICode.NoResultsFound]: {
    [Language.Spanish]: 'No se han ecnontrado resultados',
    [Language.English]: 'No results found'
  },
  [APICode.InvalidParameter]: {
    [Language.Spanish]: 'Parámetro inválido',
    [Language.English]: 'Invalid parameter'
  },
  [APICode.MeteoStationNotFound]: {
    [Language.Spanish]: 'Estación meteorológica no encontrada',
    [Language.English]: 'No meteo station found'
  }
};
