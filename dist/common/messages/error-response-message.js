"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponseMessage = exports.ErrorResponseCode = exports.ErrorSeverity = void 0;
const logger_utils_1 = __importDefault(require("../../utils/logger.utils"));
/**
 * Represents the severity levels of an error
 * @enum {string}
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    /** Low severity error */
    ErrorSeverity["LOW"] = "LOW";
    /** Medium severity error */
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    /** High severity error */
    ErrorSeverity["HIGH"] = "HIGH";
    /** Critical severity error */
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * Defines standardized error response codes across different categories
 * @enum {number}
 */
var ErrorResponseCode;
(function (ErrorResponseCode) {
    // Authentication Errors (400-499)
    /** Unauthorized access attempt */
    ErrorResponseCode[ErrorResponseCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    /** Invalid authentication token */
    ErrorResponseCode[ErrorResponseCode["INVALID_TOKEN"] = 403] = "INVALID_TOKEN";
    // Request Errors (400-499)
    /** Malformed or invalid request */
    ErrorResponseCode[ErrorResponseCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    /** Requested resource not found */
    ErrorResponseCode[ErrorResponseCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    /** Request could not be completed */
    ErrorResponseCode[ErrorResponseCode["UNABLE_TO_COMPLETE"] = 422] = "UNABLE_TO_COMPLETE";
    // Payload Errors (400-499)
    /** Payload data is incorrect or invalid */
    ErrorResponseCode[ErrorResponseCode["PAYLOAD_INCORRECT"] = 400] = "PAYLOAD_INCORRECT";
    /** Resource already exists */
    ErrorResponseCode[ErrorResponseCode["RESOURCE_ALREADY_EXISTS"] = 409] = "RESOURCE_ALREADY_EXISTS";
    // System Errors (500-599)
    /** Internal server error */
    ErrorResponseCode[ErrorResponseCode["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
})(ErrorResponseCode || (exports.ErrorResponseCode = ErrorResponseCode = {}));
/**
 * Manages error response creation and logging
 * @class
 */
class ErrorResponseMessage {
    /**
     * Logs an error using the application's logger
     * @private
     * @param {ErrorResponse} error - The error to be logged
     */
    logError(error) {
        logger_utils_1.default.error(`Error ${error.response_code}: ${error.message}`, {
            code: error.response_code,
            severity: error.severity
        });
    }
    /**
     * Creates a standardized error response
     * @public
     * @param {ErrorResponseCode} code - The error response code
     * @param {string} message - The error message
     * @param {ErrorSeverity} [severity=ErrorSeverity.MEDIUM] - The error severity (defaults to MEDIUM)
     * @returns {ErrorResponse} The created error response
     */
    createError(code, message, severity = ErrorSeverity.MEDIUM, details) {
        const error = {
            response_code: code,
            message,
            severity,
            timestamp: new Date(),
            details
        };
        this.logError(error);
        return error;
    }
    /**
     * Creates an error response for incorrect payload
     * @public
     * @param {string} payload - The payload that was incorrect
     * @returns {ErrorResponse} Error response with PAYLOAD_INCORRECT code
     */
    payloadIncorrect(payload) {
        return this.createError(ErrorResponseCode.PAYLOAD_INCORRECT, `${payload} is incorrect, check and try again!`, ErrorSeverity.HIGH);
    }
    /**
     * Creates an error response for incorrect payload
     * @public
     * @param {z.ZodError} error - The payload that was incorrect
     * @returns {ErrorResponse} Error response with PAYLOAD_INCORRECT code
     */
    badRequest(error) {
        return this.createError(ErrorResponseCode.PAYLOAD_INCORRECT, `Payload is incorrect, check and try again!`, ErrorSeverity.HIGH, error);
    }
    /**
     * Creates an error response for resource not found
     * @public
     * @param {string} resource - The name of the resource that could not be found
     * @returns {ErrorResponse} Error response with NOT_FOUND code
     */
    resourceNotFound(resource) {
        return this.createError(ErrorResponseCode.NOT_FOUND, `${resource} could not be found!`, ErrorSeverity.MEDIUM);
    }
    /**
     * Creates an error response for inability to complete a request
     * @public
     * @param {string} [reason] - Optional reason for the failure
     * @returns {ErrorResponse} Error response with UNABLE_TO_COMPLETE code
     */
    unableToComplete(reason) {
        return this.createError(ErrorResponseCode.UNABLE_TO_COMPLETE, reason || 'Unable to complete the request', ErrorSeverity.HIGH);
    }
    /**
     * Creates an error response for unauthorized access
     * @public
     * @param {string} [reason] - Optional reason for unauthorized access
     * @returns {ErrorResponse} Error response with UNAUTHORIZED code
     */
    unauthorized(reason) {
        return this.createError(ErrorResponseCode.UNAUTHORIZED, reason || 'Not authorized!', ErrorSeverity.CRITICAL);
    }
}
exports.ErrorResponseMessage = ErrorResponseMessage;
exports.default = new ErrorResponseMessage();
