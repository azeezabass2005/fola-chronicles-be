"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuccessResponseMessage = exports.SuccessResponseCode = exports.SuccessSeverity = void 0;
const logger_utils_1 = __importDefault(require("../../utils/logger.utils"));
/**
 * Represents the severity levels of success
 * @enum {string}
 */
var SuccessSeverity;
(function (SuccessSeverity) {
    /** Low severity error */
    SuccessSeverity["LOW"] = "LOW";
    /** Medium severity error */
    SuccessSeverity["MEDIUM"] = "MEDIUM";
    /** High severity error */
    SuccessSeverity["HIGH"] = "HIGH";
    /** Critical severity error */
    SuccessSeverity["CRITICAL"] = "CRITICAL";
})(SuccessSeverity || (exports.SuccessSeverity = SuccessSeverity = {}));
/**
 * Defines standardized success response codes across different categories
 * @enum {number}
 */
var SuccessResponseCode;
(function (SuccessResponseCode) {
    // Authentication Successes (1-100)
    /** Login successful */
    SuccessResponseCode[SuccessResponseCode["LOGIN_SUCCESSFUL"] = 1] = "LOGIN_SUCCESSFUL";
    /** Token refreshed successful */
    SuccessResponseCode[SuccessResponseCode["TOKEN_REFRESHED"] = 2] = "TOKEN_REFRESHED";
    // Resource Operations (101-200)
    /** Creation of resource successful */
    SuccessResponseCode[SuccessResponseCode["CREATED"] = 101] = "CREATED";
    /** Updating of resource successful */
    SuccessResponseCode[SuccessResponseCode["UPDATED"] = 102] = "UPDATED";
    /** Deletion of resource successful */
    SuccessResponseCode[SuccessResponseCode["DELETED"] = 103] = "DELETED";
    /** Retrieval of resource successful */
    SuccessResponseCode[SuccessResponseCode["RETRIEVED"] = 104] = "RETRIEVED";
    // Transaction Successes (201-300)
    /** Completion of transaction successful */
    SuccessResponseCode[SuccessResponseCode["TRANSACTION_COMPLETED"] = 201] = "TRANSACTION_COMPLETED";
    /** Batch Process completed successfully */
    SuccessResponseCode[SuccessResponseCode["BATCH_PROCESSED"] = 202] = "BATCH_PROCESSED";
    /** Validation successful */
    SuccessResponseCode[SuccessResponseCode["VALIDATION_PASSED"] = 203] = "VALIDATION_PASSED";
    // System Successes (301-400)
    /** System ready */
    SuccessResponseCode[SuccessResponseCode["SYSTEM_READY"] = 301] = "SYSTEM_READY";
    /** Configuration updated successfully */
    SuccessResponseCode[SuccessResponseCode["CONFIGURATION_UPDATED"] = 302] = "CONFIGURATION_UPDATED";
})(SuccessResponseCode || (exports.SuccessResponseCode = SuccessResponseCode = {}));
/**
 * Manages success response creation and logging
 * @class
 */
class SuccessResponseMessage {
    /**
     * Logs a success using the application's logger
     * @param {SuccessResponse} success
     * @private
     */
    logSuccess(success) {
        logger_utils_1.default.info(`Success ${success.response_code}: ${success.message}`, {
            code: success.response_code,
            severity: success.severity
        });
    }
    /**
     * Creates a standardized success response
     * @param {SuccessResponseCode} code - The success response code
     * @param {string} message - The error message
     * @param {any} data - The data returned by the success if any
     * @param {SuccessSeverity} [severity=SuccessSeverity.MEDIUM] - The success severity (defaults to medium)
     * @returns {SuccessResponse} The created success response
     */
    createSuccess(code, message, data, severity = SuccessSeverity.MEDIUM) {
        const successResponse = {
            response_code: code,
            message,
            severity,
            timestamp: new Date(),
            data
        };
        this.logSuccess(successResponse);
        return successResponse;
    }
    /**
     * Creates a success response for the created resources
     * @param {string} resource - The resource that was created
     * @param {any} data - The data returned by the resource creation
     * @returns {SuccessResponse} Success response with CREATED code
     */
    resourceCreated(resource, data) {
        return this.createSuccess(SuccessResponseCode.CREATED, `${resource} created successfully!`, data, SuccessSeverity.HIGH);
    }
    /**
     * Creates a success response for the updated resources
     * @param {string} resource - The resource that was updated
     * @param {any} data - The data returned by the resource updated
     * @returns {SuccessResponse} Success response with UPDATED code
     */
    resourceUpdated(resource, data) {
        return this.createSuccess(SuccessResponseCode.UPDATED, `${resource} updated successfully!`, data, SuccessSeverity.MEDIUM);
    }
    /**
     * Creates a success response for the deleted resource
     * @param {string} resource - The resource that was created
     * @returns {SuccessResponse} Success response with DELETED code
     */
    resourceDeleted(resource) {
        return this.createSuccess(SuccessResponseCode.DELETED, `${resource} deleted successfully!`, null, SuccessSeverity.LOW);
    }
    /**
     * Creates a success response for successful authentication
     * @param {string} username - The username of the authenticated user
     * @returns {SuccessResponse} Success response with LOGIN_SUCCESSFUL code
     */
    authenticationSuccess(username) {
        return this.createSuccess(SuccessResponseCode.LOGIN_SUCCESSFUL, `Welcome back, ${username}!`, { username }, SuccessSeverity.HIGH);
    }
    /**
     * Creates a success response for generic successes
     * @param {string} message - This is the message for the generic success
     * @param {any} data - The data returned by the generic success
     * @returns {SuccessResponse} Success response with CREATED code
     */
    genericSuccess(message, data) {
        return this.createSuccess(SuccessResponseCode.SYSTEM_READY, message, data, SuccessSeverity.LOW);
    }
}
exports.SuccessResponseMessage = SuccessResponseMessage;
exports.default = new SuccessResponseMessage();
