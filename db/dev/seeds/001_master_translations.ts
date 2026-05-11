import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes all existing entries
  await knex('translations').withSchema('master').del();

  // Insert seed entries
  await knex('translations')
    .withSchema('master')
    .insert([
      // API GENERAL ERROR MESSAGES
      { code: 'client_error_not_found', language: 'en', text: 'Resource not found' },
      { code: 'client_error_not_found', language: 'es', text: 'Recurso no encontrado' },
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
      { code: 'invalid_grants', language: 'en', text: 'Invalid grants' },
      { code: 'invalid_grants', language: 'es', text: 'Permisos inválidos' },
      { code: 'unknown_error', language: 'en', text: 'Unknown error' },
      { code: 'unknown_error', language: 'es', text: 'Error desconocido' },
      { code: 'required_parameter', language: 'en', text: 'Required parameter' },
      { code: 'required_parameter', language: 'es', text: 'Parámetro requerido' },

      // AUTH MESSAGES
      { code: 'required_token', language: 'en', text: 'Required token' },
      { code: 'required_token', language: 'es', text: 'Token requerido' },
      { code: 'session_expired', language: 'en', text: 'Session expired' },
      { code: 'session_expired', language: 'es', text: 'Sesión expirada' },
      { code: 'invalid_access_token', language: 'en', text: 'Invalid access token' },
      { code: 'invalid_access_token', language: 'es', text: 'Token de acceso inválido' },
      { code: 'invalid_refresh_token', language: 'en', text: 'Invalid refresh token' },
      { code: 'invalid_refresh_token', language: 'es', text: 'Token de actualización inválido' },

      // TRANSLATION MESSAGES
      { code: 'translation_not_found', language: 'en', text: 'Translation not found' },
      { code: 'translation_not_found', language: 'es', text: 'Traducción no encontrada' },

      // MODULES MESSAGES
      { code: 'users', language: 'en', text: 'Users' },
      { code: 'users', language: 'es', text: 'Usuarios' },
      { code: 'module_not_found', language: 'en', text: 'Module not found' },
      { code: 'module_not_found', language: 'es', text: 'Módulo no encontrado' },

      // ROLES MESSAGES
      { code: 'role_not_found', language: 'en', text: 'Role not found' },
      { code: 'role_not_found', language: 'es', text: 'Rol no encontrado' },
      { code: 'system_administrator', language: 'en', text: 'System administrator' },
      { code: 'system_administrator', language: 'es', text: 'Administrador del sistema' },
      { code: 'read_only', language: 'en', text: 'Read only' },
      { code: 'read_only', language: 'es', text: 'Solo lectura' },

      // USER MESSAGES
      { code: 'user_not_found', language: 'en', text: 'User not found' },
      { code: 'user_not_found', language: 'es', text: 'Usuario no encontrado' },
      { code: 'user_already_exists', language: 'en', text: 'User already exists' },
      { code: 'user_already_exists', language: 'es', text: 'El usuario ya existe' },
      { code: 'inactive_user', language: 'en', text: 'User is inactive' },
      { code: 'inactive_user', language: 'es', text: 'El usuario está inactivo' },
      { code: 'invalid_password', language: 'en', text: 'Invalid password' },
      { code: 'invalid_password', language: 'es', text: 'Contraseña inválida' },

      // CITY MESSAGES
      { code: 'city_not_found', language: 'en', text: 'City not found' },
      { code: 'city_not_found', language: 'es', text: 'Ciudad no encontrada' },
      { code: 'city_already_exists', language: 'en', text: 'City already exists' },
      { code: 'city_already_exists', language: 'es', text: 'La ciudad ya existe' },

      // METEO STATION MESSAGES
      { code: 'meteo_station_not_found', language: 'en', text: 'Meteorological station not found' },
      { code: 'meteo_station_not_found', language: 'es', text: 'Estación meteorológica no encontrada' },
      { code: 'meteo_station_already_exists', language: 'en', text: 'Meteorological station already exists' },
      { code: 'meteo_station_already_exists', language: 'es', text: 'La estación meteorológica ya existe' }
    ]);
}
