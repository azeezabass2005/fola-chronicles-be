"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = void 0;
const mongoose_1 = require("mongoose");
const constant_1 = require("../common/constant");
/**
 * Mongoose schema for User model
 *
 * @description Creates a schema for user authentication and basic information
 * @remarks
 * - Includes timestamps for creation and update tracking
 * - Enables virtual property transformations
 */
exports.UserSchema = new mongoose_1.Schema({
    /**
     * Username for user authentication
     * @type {string}
     * @required
     */
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username must not exceed 30 characters'],
    },
    /**
     * Hashed password for user authentication
     * @type {string}
     * @required
     */
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    /**
     * Email for user authentication
     * @type {string}
     * @required
     */
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please provide a valid email address'
        }
    },
    /**
     * Role to manage authorization to resources
     * @type {number}
     * @required
     */
    role: {
        type: Number,
        enum: {
            values: Object.values(constant_1.ROLE_MAP),
            message: 'Invalid role value'
        },
        index: true
    },
}, {
    /** Enable virtual properties when converting to plain object */
    toObject: { virtuals: true },
    /** Enable virtual properties when converting to JSON */
    toJSON: { virtuals: true },
    /** Automatically manage createdAt and updatedAt timestamps */
    timestamps: true,
});
/**
 * User model based on IUser interface
 *
 * @description Creates and exports the Mongoose model for User
 * @type {Model<IUser>}
 */
const User = (0, mongoose_1.model)(constant_1.MODEL_NAME.USER, exports.UserSchema);
exports.default = User;
