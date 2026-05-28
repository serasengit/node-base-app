import fs from 'node:fs';
import path from 'node:path';
import { createLogger, format, Logger, transports } from 'winston';
import { appConfig } from '@bootstrap/config';
import { getRequestContext } from './request-context';

// Extract the Winston format helpers used to compose the final log format.
const { combine, timestamp, printf, colorize, errors } = format;

const requestContextFormat = format((info) => {
  const requestContext = getRequestContext();

  if (requestContext) {
    info.requestId = requestContext.requestId;
    info.userId = requestContext.userId;
  }

  return info;
});

// Resolve the log level.
// If LOG_LEVEL is defined, it takes priority.
// Otherwise, production logs use "info" and non-production logs use "debug".
const logLevel = appConfig.logging.level?.toLowerCase() || (appConfig.isProduction ? 'info' : 'debug');

// Returns the current date using YYYY-MM-DD format.
const getCurrentDateFolder = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Resolve the base folder where log files will be written.
// If LOGS_FOLDER is defined, it is used as an absolute/resolved path.
// Otherwise, logs are stored under logs/<environment>/<date>.
const logBaseDir = appConfig.logging.folder ? path.resolve(appConfig.logging.folder) : path.resolve('logs', appConfig.nodeEnv);

// Resolve the daily log folder.
const logDateDir = path.join(logBaseDir, getCurrentDateFolder());

// Ensure the daily log directory exists before creating file transports.
// The recursive option creates parent directories if needed.
fs.mkdirSync(logDateDir, { recursive: true });

// Define the final text format for each log entry.
// If an error stack is available, it is logged instead of the plain message.
const logFormat = printf((info: any) => {
  const requestIdSegment = info.requestId ? ` [requestId:${info.requestId}]` : '';
  const userIdSegment = info.userId ? ` [userId:${info.userId}]` : '';

  return `${info.timestamp} [${info.level}]${requestIdSegment}${userIdSegment}: ${info.stack || info.message}`;
});

// Base format shared by file and production console logs.
// Includes timestamp and automatic stack trace support for Error objects.
const baseFormat = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat);

// Create the main Winston logger instance.
const logger: Logger = createLogger({
  // Minimum log level handled by the logger.
  level: logLevel,

  // Default format used by the configured transports.
  format: combine(requestContextFormat(), baseFormat),

  // File transports:
  // - combined.log stores all logs from the configured level upwards.
  // - error.log stores only error-level logs.
  transports: [
    new transports.File({
      filename: path.join(logDateDir, 'combined.log')
    }),
    new transports.File({
      filename: path.join(logDateDir, 'error.log'),
      level: 'error'
    })
  ]
});

// Add console logging.
// In production, use the same plain format as files.
// In non-production environments, enable colorized log levels for readability.
logger.add(
  new transports.Console({
    format:
      appConfig.isProduction ?
        combine(requestContextFormat(), baseFormat)
      : combine(requestContextFormat(), colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat)
  })
);

export default logger;
