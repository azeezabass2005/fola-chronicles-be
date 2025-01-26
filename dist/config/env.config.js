"use strict";
// src/config/env.config.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
/**
 * Load environment variables based on current NODE_ENV
 * @function loadEnvConfig
 * @returns {EnvConfig} Environment configuration object
 */
const loadEnvConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    // Load environment-specific .env file
    const envPath = path_1.default.resolve(process.cwd(), `.env.${env}`);
    const defaultPath = path_1.default.resolve(process.cwd(), '.env');
    const envResult = dotenv_1.default.config({ path: envPath });
    const defaultResult = dotenv_1.default.config({ path: defaultPath });
    if (envResult.error && defaultResult.error) {
        logger_utils_1.default.warn('No .env file found, using default values', {
            envPath,
            defaultPath
        });
    }
    const config = {
        NODE_ENV: env,
        PORT: parseInt(process.env.PORT || '3500', 10),
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name',
        JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key',
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
        API_VERSION: process.env.API_VERSION || 'v1',
        CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
        RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        REDIS_URL: process.env.REDIS_URL,
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        LOG_RETENTION_DAYS: parseInt(process.env.LOG_RETENTION_DAYS || '30', 10)
    };
    // Log configuration on startup
    logger_utils_1.default.info('Environment configuration loaded', {
        environment: config.NODE_ENV,
        apiVersion: config.API_VERSION,
        logLevel: config.LOG_LEVEL
    });
    return config;
};
const config = loadEnvConfig();
exports.default = config;
