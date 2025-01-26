import { Router, Request, Response, NextFunction } from "express";
import logger from "../../utils/logger.utils";
import UserService from "../../services/user.service";
import { ErrorResponse } from "../../common/messages/error-response-message";

/**
 * Interface for controller construction options
 * @interface ControllerOptions
 */
interface ControllerOptions {
    userService?: UserService;
}

/**
 * Abstract base controller providing common functionality and logger integration
 * @abstract
 * @class BaseController
 */
abstract class BaseController {
    /** Express router for handling routes */
    public router: Router;

    /** User service for authentication and user-related operations */
    protected userService: UserService;

    /** Application logger */
    protected logger: typeof logger;

    /**
     * Constructor for BaseController
     * @param {ControllerOptions} [options={}] - Optional configuration options
     */
    protected constructor(options: ControllerOptions = {}) {
        this.router = Router();
        this.userService = options.userService || new UserService();
        this.logger = logger;

        this.initializeMiddleware();
        this.setupRoutes();
    }

    /**
     * Initialize middleware for all routes in this controller
     * @protected
     */
    protected initializeMiddleware(): void {
        // Log all requests
        this.router.use((req: Request, res: Response, next: NextFunction) => {
            this.logger.http(`${req.method} ${req.path}`, {
                body: req.body,
                query: req.query,
                params: req.params,
                ip: req.ip
            });
            next();
        });
    }

    /**
     * Abstract method to set up routes for the controller
     * Must be implemented by child classes
     * @abstract
     * @protected
     */
    protected abstract setupRoutes(): void;

    /**
     * Centralized error handling method
     * @param {Error} err - The error object
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next middleware function
     */
    protected handleError(
        err: Error,
        req: Request,
        res: Response,
        next: NextFunction
    ): void {
        // Log the error with detailed context
        this.logger.error(`Error in request: ${err.message}`, {
            error: {
                name: err.name,
                message: err.message,
                stack: err.stack
            },
            request: {
                path: req.path,
                method: req.method,
                body: req.body,
                query: req.query,
                params: req.params,
                ip: req.ip
            }
        });

        // Determine appropriate status code
        const statusCode = this.determineStatusCode(err);

        // Send error response
        res.status(statusCode).json({
            success: false,
            message: err.message || 'Unexpected error occurred',
            error_code: statusCode
        });
    }

    /**
     * Determines the appropriate HTTP status code based on error type
     * @param {Error} err - The error object
     * @returns {number} HTTP status code
     * @private
     */
    private determineStatusCode(err: Error): number {
        switch (err.name) {
            case 'ValidationError': return 400;
            case 'UnauthorizedError': return 401;
            case 'ForbiddenError': return 403;
            case 'NotFoundError': return 404;
            case 'ConflictError': return 409;
            default: return 500;
        }
    }

    /**
     * Sends a standardized success response
     * @param {Response} res - Express response object
     * @param {any} [data={}] - Response data
     * @param {number} [statusCode=200] - HTTP status code
     */
    protected sendSuccess(
        res: Response,
        data: any = {},
        statusCode: number = 200
    ): void {
        // Log successful response
        this.logger.info(`Successful response`, {
            statusCode,
            dataType: typeof data,
            responseSize: JSON.stringify(data).length
        });

        res.status(statusCode).json({
            success: true,
            data
        });
    }

    /**
     * Wraps an async route handler with error handling
     * @param {Function} fn - The async route handler function
     * @returns {Function} Express middleware function
     * @protected
     */
    protected wrapAsync(fn: Function) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                await fn(req, res, next);
            } catch (error) {
                next(error);
            }
        };
    }
}

export default BaseController;