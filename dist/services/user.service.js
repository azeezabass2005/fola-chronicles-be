"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_utils_1 = __importDefault(require("../utils/db.utils"));
const user_model_1 = __importDefault(require("../models/user.model"));
/**
 * Service class for User-related database operations
 *
 * @description Extends the generic DBService with User-specific configurations
 * @extends {DBService<IUser>}
 */
class UserService extends db_utils_1.default {
    /**
     * Creates an instance of UserService
     *
     * @constructor
     * @param {string[]} [populatedFields=[]] - Optional fields to populate during queries
     * @example
     * // Create a UserService with populated references
     * new UserService(['profile', 'roles'])
     */
    constructor(populatedFields = []) {
        // Initialize the service with User model and optional population fields
        super(user_model_1.default, populatedFields);
    }
}
exports.default = UserService;
