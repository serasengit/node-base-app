import fs from 'node:fs';
import path from 'node:path';
import { createLogger, format, Logger, transports } from 'winston';

// Extract the Winston format helpers used to compose the final log format.
const { combine, timestamp, printf, colorize, errors } = format;

// Normalize the current environment.
// Defaults to "dev" when NODE_ENV is not defined.
const rawEnv = (process.env.NODE_ENV || 'dev').trim().toLowerCase();

// Determine whether the application is running in production mode.
const isProduction = rawEnv === 'prod' || rawEnv === 'production';

// Resolve the log level.
// If LOG_LEVEL is defined, it takes priority.
// Otherwise, production logs use "info" and non-production logs use "debug".
const logLevel = process.env.LOG_LEVEL?.trim().toLowerCase() || (isProduction ? 'info' : 'debug');

// Resolve the base folder where log files will be written.
// If LOGS_FOLDER is defined, it is used as an absolute/resolved path.
// Otherwise, logs are stored under logs/<environment>.
const logBaseDir = process.env.LOGS_FOLDER ? path.resolve(process.env.LOGS_FOLDER) : path.resolve('logs', rawEnv);

// Ensure the log directory exists before creating file transports.
// The recursive option creates parent directories if needed.
fs.mkdirSync(logBaseDir, { recursive: true });

// Define the final text format for each log entry.
// If an error stack is available, it is logged instead of the plain message.
const logFormat = printf((info: any) => `${info.timestamp} [${info.level}]: ${info.stack || info.message}`);

// Base format shared by file and production console logs.
// Includes timestamp and automatic stack trace support for Error objects.
const baseFormat = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat);

// Create the main Winston logger instance.
const logger: Logger = createLogger({
  // Minimum log level handled by the logger.
  level: logLevel,

  // Default format used by the configured transports.
  format: baseFormat,

  // File transports:
  // - combined.log stores all logs from the configured level upwards.
  // - error.log stores only error-level logs.
  transports: [
    new transports.File({
      filename: path.join(logBaseDir, 'combined.log')
    }),
    new transports.File({
      filename: path.join(logBaseDir, 'error.log'),
      level: 'error'
    })
  ]
});

// Add console logging.
// In production, use the same plain format as files.
// In non-production environments, enable colorized log levels for readability.
logger.add(
  new transports.Console({
    format: isProduction
      ? baseFormat
      : combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat)
  })
);

export default logger;
