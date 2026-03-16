// src/config/env.config.ts

import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger.utils';

/**
 * Environment configuration interface
 * @interface EnvConfig
 */
interface EnvConfig {
    /** Node environment (development, production, test) */
    NODE_ENV: string;
    /** Server port number */
    PORT: number;
    /** MongoDB connection URI */
    MONGODB_URI: string;
    /** JWT secret key */
    JWT_SECRET: string;
    /** JWT token expiration time */
    JWT_EXPIRES_IN: string;
    /** API version */
    API_VERSION: string;
    /** Cors origin */
    CORS_ORIGIN: string;
    /** Cookie Domain */
    COOKIE_DOMAIN: string;
    /** Rate limit window in minutes */
    RATE_LIMIT_WINDOW_MS: number;
    /** Maximum requests per window */
    RATE_LIMIT_MAX: number;
    /** Redis URL for caching */
    REDIS_URL?: string;
    /** Log level */
    LOG_LEVEL: string;
    /** Log retention days */
    LOG_RETENTION_DAYS: number;
    /** Mail host */
    MAIL_HOST: string;
    /** Mail port */
    MAIL_PORT: string;
    /** Mail secure */
    MAIL_SECURE: string;
    /** Mail username */
    MAIL_USERNAME: string;
    /** Mail password */
    MAIL_PASSWORD: string;
    /** Mail from address */
    MAIL_FROM: string;
}

/**
 * Required environment variables for production
 */
const REQUIRED_PROD_VARS = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CORS_ORIGIN',
    'COOKIE_DOMAIN'
] as const;

/**
 * Sensitive variables that should never use defaults in production
 */
const SENSITIVE_VARS = [
    'MONGODB_URI',
    'JWT_SECRET',
    'MAIL_PASSWORD'
] as const;

/**
 * Validates required environment variables
 * @param env - Current environment
 * @throws {Error} If required variables are missing in production
 */
const validateRequiredVars = (env: string): void => {
    if (env === 'production') {
        const missing: string[] = [];
        
        for (const varName of REQUIRED_PROD_VARS) {
            if (!process.env[varName] || process.env[varName]?.trim() === '') {
                missing.push(varName);
            }
        }

        if (missing.length > 0) {
            throw new Error(
                `Missing required environment variables for production: ${missing.join(', ')}\n` +
                `Please check your .env file and ensure all required variables are set.\n` +
                `See .env.example for reference.`
            );
        }

        // Additional security check for JWT_SECRET
        if (process.env.JWT_SECRET === 'your-super-secret-key-change-this-in-production' ||
            (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32)) {
            throw new Error(
                'JWT_SECRET must be changed from default value and be at least 32 characters long in production.\n' +
                'Generate a strong random secret key for security.'
            );
        }
    }
};

/**
 * Load environment variables based on current NODE_ENV
 * @function loadEnvConfig
 * @returns {EnvConfig} Environment configuration object
 * @throws {Error} If required variables are missing in production
 */
const loadEnvConfig = (): EnvConfig => {
    const env = process.env.NODE_ENV || 'development';

    // Load environment-specific .env file
    const envPath = path.resolve(process.cwd(), `.env.${env}`);
    const defaultPath = path.resolve(process.cwd(), '.env');

    const envResult = dotenv.config({ path: envPath });
    const defaultResult = dotenv.config({ path: defaultPath });

    if (envResult.error && defaultResult.error) {
        if (env === 'production') {
            throw new Error(
                `No .env file found for production environment.\n` +
                `Expected files: ${envPath} or ${defaultPath}\n` +
                `Please create a .env file based on .env.example`
            );
        }
        logger.warn('No .env file found, using default values for development', {
            envPath,
            defaultPath
        });
    }

    // Validate required variables (throws in production if missing)
    validateRequiredVars(env);

    // Safe defaults only for development/test environments
    const isDevelopment = env === 'development' || env === 'test';
    
    // Helper function to get value or fail if sensitive and in production
    const getEnvVar = (key: string, defaultValue: string = '', allowDefault: boolean = true): string => {
        const value = process.env[key];
        const isSensitive = SENSITIVE_VARS.includes(key as any);
        
        if (!value || value.trim() === '') {
            if (isSensitive && !isDevelopment) {
                throw new Error(
                    `Missing required environment variable: ${key}\n` +
                    `This variable is sensitive and cannot use default values in ${env} environment.`
                );
            }
            if (!allowDefault && !isDevelopment) {
                throw new Error(
                    `Missing required environment variable: ${key}\n` +
                    `This variable is required in ${env} environment.`
                );
            }
            return defaultValue;
        }
        return value;
    };

    // Helper function to parse cookie domain (remove protocol and port)
    const parseCookieDomain = (value: string): string => {
        if (!value) return '';
        
        // Remove protocol (http://, https://)
        let domain = value.replace(/^https?:\/\//, '');
        
        // Remove port number
        domain = domain.split(':')[0];
        
        // Remove trailing slash
        domain = domain.replace(/\/$/, '');
        
        return domain;
    };
    
    const config = {
        NODE_ENV: env,
        PORT: parseInt(process.env.PORT || '3500', 10),
        MONGODB_URI: getEnvVar('MONGODB_URI', isDevelopment ? 'mongodb://localhost:27017/fola-safe-space' : '', false),
        JWT_SECRET: getEnvVar('JWT_SECRET', isDevelopment ? 'dev-secret-key-not-for-production-use-only-change-this-immediately' : '', false),
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
        API_VERSION: process.env.API_VERSION || 'v1',
        CORS_ORIGIN: getEnvVar('CORS_ORIGIN', isDevelopment ? '*' : '', false),
        COOKIE_DOMAIN: parseCookieDomain(getEnvVar('COOKIE_DOMAIN', isDevelopment ? 'localhost' : '', false)),
        RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        REDIS_URL: process.env.REDIS_URL,
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        LOG_RETENTION_DAYS: parseInt(process.env.LOG_RETENTION_DAYS || '30', 10),
        MAIL_HOST: process.env.MAIL_HOST || '',
        MAIL_PORT: process.env.MAIL_PORT || '587',
        MAIL_SECURE: process.env.MAIL_SECURE || 'false',
        MAIL_USERNAME: process.env.MAIL_USERNAME || '',
        MAIL_PASSWORD: getEnvVar('MAIL_PASSWORD', '', true),
        MAIL_FROM: process.env.MAIL_FROM || 'noreply@fola-safe-space.com'
    };

    // Log configuration on startup (without sensitive data)
    logger.info('Environment configuration loaded', {
        environment: config.NODE_ENV,
        apiVersion: config.API_VERSION,
        logLevel: config.LOG_LEVEL,
        port: config.PORT
    });

    // Warn if using development defaults in non-dev environment
    if (!isDevelopment && (envResult.error && defaultResult.error)) {
        logger.warn('Running without .env file - ensure all environment variables are set via system environment');
    }

    return config;
};

const config = loadEnvConfig();

export default config;