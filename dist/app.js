"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const env_config_1 = __importDefault(require("./config/env.config"));
const logger_utils_1 = __importDefault(require("./utils/logger.utils"));
// import errorHandler from './middlewares/error.middleware';
const routes_1 = __importDefault(require("./routes"));
const db_config_1 = __importDefault(require("./config/db.config"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
/**
 * Express application wrapper class
 * @class App
 */
class App {
    /**
     * Creates an instance of App
     * Initializes Express application and middlewares
     */
    constructor() {
        this.app = (0, express_1.default)();
        this.dbService = db_config_1.default.getInstance();
        this.setupMiddlewares();
        this.setupDatabase().then(() => { });
        this.setupRoutes();
        this.setupErrorHandling();
    }
    /**
     * Configure application middlewares
     * @private
     */
    setupMiddlewares() {
        // Security middlewares
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: [
                'http://localhost:3000',
                'localhost:3000',
                'http://172.18.177.41:3000',
            ],
            credentials: true,
            exposedHeaders: ['set-cookie']
        }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: env_config_1.default.RATE_LIMIT_WINDOW_MS,
            limit: env_config_1.default.RATE_LIMIT_MAX,
            handler: (req, res) => {
                logger_utils_1.default.warn('Rate limit exceeded', {
                    ip: req.ip,
                    path: req.path
                });
                res.status(429).json({
                    success: false,
                    message: 'Too many requests, please try again later'
                });
            }
        });
        this.app.use('/api', limiter);
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Request logging
        this.app.use((0, morgan_1.default)('combined', {
            stream: {
                write: (message) => {
                    logger_utils_1.default.http(message.trim());
                }
            }
        }));
    }
    /**
     * Configure database connection
     * @private
     */
    setupDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbService.connect();
        });
    }
    /**
     * Configure application routes
     * @private
     */
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (_req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: env_config_1.default.NODE_ENV,
                mongodb: mongoose_1.default.connection.readyState === 1
            };
            logger_utils_1.default.debug('Health check requested', health);
            res.status(200).json(health);
        });
        // API routes
        this.app.use(`/api/${env_config_1.default.API_VERSION}`, routes_1.default);
    }
    /**
     * Configure error handling
     * @private
     */
    setupErrorHandling() {
        // this.app.use(errorHandler);
        error_middleware_1.default.initialize(this.app);
        // Handle 404 errors
        this.app.use((req, res) => {
            logger_utils_1.default.warn('Route not found', {
                method: req.method,
                path: req.path,
                ip: req.ip
            });
            res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        });
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger_utils_1.default.error('Uncaught Exception', {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            });
            process.exit(1);
        });
        // Handle unhandled rejections
        process.on('unhandledRejection', (reason) => {
            logger_utils_1.default.error('Unhandled Rejection', {
                reason: reason instanceof Error ? {
                    name: reason.name,
                    message: reason.message,
                    stack: reason.stack
                } : reason
            });
        });
    }
    /**
     * Start the application server
     * @public
     */
    start() {
        this.app.listen(env_config_1.default.PORT, () => {
            logger_utils_1.default.info(`Server started`, {
                port: env_config_1.default.PORT,
                environment: env_config_1.default.NODE_ENV,
                nodeVersion: process.version
            });
        });
    }
}
exports.default = App;
