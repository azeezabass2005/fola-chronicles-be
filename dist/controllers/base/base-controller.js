"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_utils_1 = __importDefault(require("../../utils/logger.utils"));
const user_service_1 = __importDefault(require("../../services/user.service"));
class BaseController {
    constructor(options = {}) {
        this.router = (0, express_1.Router)();
        this.userService = options.userService || new user_service_1.default();
        this.logger = logger_utils_1.default;
        this.initializeMiddleware();
        this.setupRoutes();
    }
    initializeMiddleware() {
        this.router.use((req, _res, next) => {
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
     * Sends a standardized success response
     * @param {Response} res - Express response object
     * @param {any} [data={}] - Response data
     * @param {number} [statusCode=200] - HTTP status code
     */
    sendSuccess(res, data = {}, statusCode = 200) {
        // Check if response already sent
        if (res.headersSent) {
            this.logger.warn('Attempted to send response after headers already sent');
            return;
        }
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
}
exports.default = BaseController;
