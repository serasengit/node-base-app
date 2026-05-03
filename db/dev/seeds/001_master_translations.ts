import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes all existing entries
  await knex('translations').del();

  // Insert seed entries
  await knex('translations').insert([
    // API_MESSAGES
    { code: 'internal_server_error', language: 'en', text: 'Internal server error' },
    { code: 'internal_server_error', language: 'es', text: 'Error interno del servidor' },
    { code: 'server_error_not_implemented', language: 'en', text: 'Server error not implemented' },
    { code: 'server_error_not_implemented', language: 'es', text: 'Error del servidor no implementado' },
    { code: 'client_error_unprocessable_entity', language: 'en', text: 'Client error unprocessable entity' },
    { code: 'client_error_unprocessable_entity', language: 'es', text: 'Error del cliente entidad no procesable' },
    { code: 'malformed_request', language: 'en', text: 'Malformed request' },
    { code: 'malformed_request', language: 'es', text: 'Solicitud mal formada' },
    { code: 'no_results_found', language: 'en', text: 'No results found' },
    { code: 'no_results_found', language: 'es', text: 'No se encontraron resultados' },
    { code: 'invalid_parameter', language: 'en', text: 'Invalid parameter' },
    { code: 'invalid_parameter', language: 'es', text: 'Parámetro inválido' },
    { code: 'required_token', language: 'en', text: 'Required token' },
    { code: 'required_token', language: 'es', text: 'Token requerido' },
    { code: 'unknown_error', language: 'en', text: 'Unknown error' },
    { code: 'unknown_error', language: 'es', text: 'Error desconocido' },
    { code: 'required_parameter', language: 'en', text: 'Required parameter' },
    { code: 'required_parameter', language: 'es', text: 'Parámetro requerido' },

    // CITY_MESSAGES
    { code: 'city_not_found', language: 'en', text: 'City not found' },
    { code: 'city_not_found', language: 'es', text: 'Ciudad no encontrada' },
    { code: 'city_already_exists', language: 'en', text: 'City already exists' },
    { code: 'city_already_exists', language: 'es', text: 'La ciudad ya existe' },

    // TRANSLATION_MESSAGES
    { code: 'translation_not_found', language: 'en', text: 'Translation not found' },
    { code: 'translation_not_found', language: 'es', text: 'Traducción no encontrada' },

    // METEO_STATION_MESSAGES
    { code: 'meteo_station_not_found', language: 'en', text: 'Meteorological station not found' },
    { code: 'meteo_station_not_found', language: 'es', text: 'Estación meteorológica no encontrada' },
    { code: 'meteo_station_already_exists', language: 'en', text: 'Meteorological station already exists' },
    { code: 'meteo_station_already_exists', language: 'es', text: 'La estación meteorológica ya existe' }
  ]);
}
