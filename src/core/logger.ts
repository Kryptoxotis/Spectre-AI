/**
 * Structured logging system for Spectre AI Assistant
 * Provides consistent logging format for external AI review
 */

import winston from 'winston';
import { config } from './config';

/**
 * Log levels and their priorities
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * Custom log format for structured logging
 */
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Spectre Logger Class
 */
class SpectreLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      levels: logLevels,
      level: config.getValue('logLevel'),
      format: logFormat,
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // File transport
        new winston.transports.File({
          filename: config.getValue('logFile'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });
  }

  /**
   * Log a successful action
   */
  public success(
    agent: string,
    action: string,
    error?: string,
    projectId?: string,
    context?: string,
    status?: string,
    metadata?: Record<string, any>
  ): void {
    this.log('info', {
      type: 'success',
      agent,
      action,
      error,
      projectId,
      context,
      status,
      metadata
    });
  }

  /**
   * Log a failed action
   */
  public failure(
    agent: string,
    action: string,
    error: string,
    projectId?: string,
    context?: string,
    status?: string,
    metadata?: Record<string, any>
  ): void {
    this.log('error', {
      type: 'failure',
      agent,
      action,
      error,
      projectId,
      context,
      status,
      metadata
    });
  }

  /**
   * Log a warning
   */
  public warning(
    agent: string,
    action: string,
    message: string,
    projectId?: string,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    this.log('warn', {
      type: 'warning',
      agent,
      action,
      message,
      projectId,
      context,
      metadata
    });
  }

  /**
   * Log debug information
   */
  public debug(
    agent: string,
    action: string,
    message: string,
    projectId?: string,
    metadata?: Record<string, any>
  ): void {
    this.log('debug', {
      type: 'debug',
      agent,
      action,
      message,
      projectId,
      metadata
    });
  }

  /**
   * Internal logging method
   */
  private log(level: string, data: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      ...data
    };

    this.logger.log(level, logEntry);
  }

  /**
   * Get logger instance for direct access
   */
  public getLogger(): winston.Logger {
    return this.logger;
  }
}

// Export singleton instance
export const spectreLogger = new SpectreLogger();