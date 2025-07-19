/**
 * Configuration management for Spectre AI Assistant
 * Handles environment variables and validation
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration schema for environment variables
 */
const configSchema = z.object({
  // Server configuration
  port: z.string().transform(val => parseInt(val, 10)).default('3000'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  debugMode: z.string().transform(val => val === 'true').default('false'),
  
  // CORS configuration
  corsOrigin: z.string().default('*'),
  
  // API Keys
  claudeApiKey: z.string().min(1, 'Claude API key is required'),
  githubToken: z.string().min(1, 'GitHub token is required'),
  notionToken: z.string().optional(),
  supabaseUrl: z.string().optional(),
  supabaseKey: z.string().optional(),
  vercelToken: z.string().optional(),
  
  // Database configuration
  databaseUrl: z.string().default('sqlite:./data/spectre.db'),
  
  // ChromaDB configuration
  chromaUrl: z.string().default('http://localhost:8000'),
  
  // Logging configuration
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  logFile: z.string().default('./logs/spectre.log'),
  
  // Rate limiting
  rateLimitWindow: z.string().transform(val => parseInt(val, 10)).default('900000'), // 15 minutes
  rateLimitMax: z.string().transform(val => parseInt(val, 10)).default('100'),
  
  // Security
  sessionSecret: z.string().default('spectre-secret-key-change-in-production'),
  jwtSecret: z.string().default('spectre-jwt-secret-change-in-production'),
  
  // Feature flags
  enableLearning: z.string().transform(val => val === 'true').default('true'),
  enableMCP: z.string().transform(val => val === 'true').default('true'),
  enableWebInterface: z.string().transform(val => val === 'true').default('true'),
});

/**
 * Configuration class
 */
class Config {
  private config: z.infer<typeof configSchema>;

  constructor() {
    this.config = configSchema.parse(process.env);
  }

  /**
   * Get a configuration value
   */
  getValue<K extends keyof z.infer<typeof configSchema>>(key: K): z.infer<typeof configSchema>[K] {
    return this.config[key];
  }

  /**
   * Get all configuration values
   */
  getAll(): z.infer<typeof configSchema> {
    return { ...this.config };
  }

  /**
   * Validate configuration
   */
  validate(): void {
    try {
      configSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
        throw new Error(`Configuration validation failed. Missing or invalid variables: ${missingVars}`);
      }
      throw error;
    }
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.config.debugMode;
  }
}

// Export singleton instance
export const config = new Config();