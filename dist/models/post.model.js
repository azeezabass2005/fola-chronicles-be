"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostSchema = void 0;
const mongoose_1 = require("mongoose");
const constant_1 = require("../common/constant");
/**
 * Mongoose schema for Post model
 *
 * @description Creates a schema for post
 * @remarks
 * - Includes timestamps for creation and update tracking
 * - Enables virtual property transformations
 */
exports.PostSchema = new mongoose_1.Schema({
    /**
     * Title of the post
     * @type {string}
     * @required
     */
    title: { type: String, required: true },
    /**
     * Content of the post
     * @type {string}
     * @required
     */
    content: { type: String, required: true },
    /**
     * Tags for the post
     * @type {string[]}
     * @default []
     */
    tags: { type: [String], default: [] },
    /**
     * Category of the post
     * @type {string}
     * @required
     */
    category: { type: String, required: true },
    /**
     * User ID of the post creator
     * @type {Schema.Types.ObjectId}
     * @required
     * @ref UserModel
     */
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: constant_1.MODEL_NAME.USER, required: true },
    /**
     * Number of views for the post
     * @type {number}
     * @default 0
     */
    viewCount: { type: Number, default: 0 },
    /**
     * Number of likes for the post
     * @type {number}
     * @default 0
     */
    likeCount: { type: Number, default: 0 },
}, {
    /** Enable virtual properties when converting to plain object */
    toObject: { virtuals: true },
    /** Enable virtual properties when converting to JSON */
    toJSON: { virtuals: true },
    /** Automatically manage createdAt and updatedAt timestamps */
    timestamps: true,
});
/**
 * Add text index for search
 * @description Adds a text index to the title and content fields
 */
exports.PostSchema.index({ title: 'text', content: 'text' });
/**
 * Post model based on IPost interface
 *
 * @description Creates and exports the Mongoose model for Post
 * @type {Model<IPost>}
 */
const Post = (0, mongoose_1.model)(constant_1.MODEL_NAME.POST, exports.PostSchema);
exports.default = Post;
