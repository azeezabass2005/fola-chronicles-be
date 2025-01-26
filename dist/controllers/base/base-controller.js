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
const express_1 = require("express");
const logger_utils_1 = __importDefault(require("../../utils/logger.utils"));
const user_service_1 = __importDefault(require("../../services/user.service"));
/**
 * Abstract base controller providing common functionality and logger integration
 * @abstract
 * @class BaseController
 */
class BaseController {
    /**
     * Constructor for BaseController
     * @param {ControllerOptions} [options={}] - Optional configuration options
     */
    constructor(options = {}) {
        this.router = (0, express_1.Router)();
        this.userService = options.userService || new user_service_1.default();
        this.logger = logger_utils_1.default;
        this.initializeMiddleware();
        this.setupRoutes();
    }
    /**
     * Initialize middleware for all routes in this controller
     * @protected
     */
    initializeMiddleware() {
        // Log all requests
        this.router.use((req, res, next) => {
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
     * Centralized error handling method
     * @param {Error} err - The error object
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next middleware function
     */
    handleError(err, req, res, next) {
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
    determineStatusCode(err) {
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
    sendSuccess(res, data = {}, statusCode = 200) {
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
    wrapAsync(fn) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield fn(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = BaseController;
