import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import config from './config/env.config';
import logger from './utils/logger.utils';
// import errorHandler from './middlewares/error.middleware';
import routes from './routes';
import DatabaseService from "./config/db.config";
import ResponseErrorHandler from "./middlewares/error.middleware";


/**
 * Express application wrapper class
 * @class App
 */
class App {
    public app: Express;
    private dbService: DatabaseService;

    /**
     * Creates an instance of App
     * Initializes Express application and middlewares
     */
    constructor() {
        this.app = express();
        this.dbService = DatabaseService.getInstance();
        this.setupMiddlewares();
        this.setupDatabase().then(() => {});
        this.setupRoutes();
        this.setupErrorHandling();

    }

    /**
     * Configure application middlewares
     * @private
     */
    private setupMiddlewares(): void {
        // Security middlewares
        this.app.use(helmet());
        
        // Configure CORS from environment variables
        const corsOrigins = this.getCorsOrigins();
        this.app.use(cors({
            origin: corsOrigins,
            credentials: true,
            exposedHeaders: ['set-cookie']
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: config.RATE_LIMIT_WINDOW_MS,
            limit: config.RATE_LIMIT_MAX,
            handler: (req: Request, res: Response) => {
                logger.warn('Rate limit exceeded', {
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

        // Stricter rate limiting for auth endpoints (prevent brute force)
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            limit: 10, // 10 attempts per window
            handler: (req: Request, res: Response) => {
                logger.warn('Auth rate limit exceeded', {
                    ip: req.ip,
                    path: req.path
                });
                res.status(429).json({
                    success: false,
                    message: 'Too many authentication attempts, please try again later'
                });
            }
        });
        this.app.use(`/api/${config.API_VERSION}/public/auth/login`, authLimiter);
        this.app.use(`/api/${config.API_VERSION}/public/auth/register`, authLimiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Compression
        this.app.use(compression());

        // Request logging
        this.app.use(morgan('combined', {
            stream: {
                write: (message: string) => {
                    logger.http(message.trim());
                }
            }
        }));
    }

    /**
     * Configure database connection
     * @private
     */
    private async setupDatabase(): Promise<void> {
        await this.dbService.connect()
    }

    /**
     * Configure application routes
     * @private
     */
    private setupRoutes(): void {
        // Health check endpoint
        this.app.get('/health', (_req: Request, res: Response) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: config.NODE_ENV,
                mongodb: mongoose.connection.readyState === 1
            };

            logger.debug('Health check requested', health);
            res.status(200).json(health);
        });

        // API routes
        this.app.use(`/api/${config.API_VERSION}`, routes);
    }

    /**
     * Configure error handling
     * @private
     */
    private setupErrorHandling(): void {
        // this.app.use(errorHandler);

        ResponseErrorHandler.initialize(this.app)

        // Handle 404 errors
        this.app.use((req: Request, res: Response) => {
            logger.warn('Route not found', {
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
        process.on('uncaughtException', (error: Error) => {
            logger.error('Uncaught Exception', {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            });
            process.exit(1);
        });

        // Handle unhandled rejections
        process.on('unhandledRejection', (reason: any) => {
            logger.error('Unhandled Rejection', {
                reason: reason instanceof Error ? {
                    name: reason.name,
                    message: reason.message,
                    stack: reason.stack
                } : reason
            });
        });
    }

    /**
     * Get CORS origins from environment variables
     * @private
     * @returns {string[]} Array of allowed origins
     */
    private getCorsOrigins(): boolean | string | string[] {
        const corsOrigin = config.CORS_ORIGIN;

        if (!corsOrigin || corsOrigin === '*') {
            // In production, '*' should not be used for security
            if (config.NODE_ENV === 'production') {
                logger.warn('CORS_ORIGIN is set to "*" in production - this is insecure');
            }
            // Return true to reflect the request origin (works with credentials: true)
            return true;
        }

        // Support comma-separated origins
        if (corsOrigin.includes(',')) {
            return corsOrigin.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0);
        }

        return corsOrigin;
    }

    /**
     * Start the application server
     * @public
     */
    public start(): void {
        this.app.listen(config.PORT, () => {
            logger.info(`Server started`, {
                port: config.PORT,
                environment: config.NODE_ENV,
                nodeVersion: process.version
            });
        });
    }
}

export default App;
