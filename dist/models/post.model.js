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
exports.PostSchema = void 0;
const mongoose_1 = require("mongoose");
const constant_1 = require("../common/constant");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
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
     * @type {Schema.Types.ObjectId[]}
     * @default []
     */
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Tag" }],
    /**
     * Category of the post
     * @type {Schema.Types.ObjectId}
     * @required
     */
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", required: true },
    /**
     * Slug of the post
     * @type {String}
     * @required
     */
    slug: {
        type: String,
        unique: true,
        index: true
    },
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
    /**
     * Number of dislikes for the post
     * @type {number}
     * @default 0
     */
    dislikeCount: { type: Number, default: 0 },
    /**
     * Number of bookmarks of the post
     * @type {number}
     * @default 0
     */
    bookmarkCount: { type: Number, default: 0 },
    /**
     * Number of comments on the post
     * @type {number}
     * @default 0
     */
    commentCount: { type: Number, default: 0 },
    /**
     * The current publication status
     * @type {PublicationStatus}
     * @default draft
     */
    publicationStatus: { type: String, enum: Object.values(constant_1.PUBLICATION_STATUS), default: constant_1.PUBLICATION_STATUS.DRAFT }
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
exports.PostSchema.index({ title: 'text', content: 'text', category: 'text', tags: 'text', slug: 'text' });
exports.PostSchema.plugin(mongoose_paginate_v2_1.default);
exports.PostSchema.virtual('readingTime').get(function () {
    if (!this.content)
        return 0;
    const plainText = this.content
        .replace(/[#_*~`>!-]/g, '') // remove common markdown symbols
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // keep link text only
        .replace(/!\[.*\]\([^)]+\)/g, '') // remove images
        .replace(/```[\s\S]*?```/g, '') // remove code blocks
        .replace(/`[^`]+`/g, '') // remove inline code
        .replace(/>\s+/g, '') // remove blockquote markers
        .replace(/\s+/g, ' ') // collapse whitespace
        .trim();
    const words = plainText.trim().split(/\s+/).length;
    return Math.ceil(words / 200);
});
function createSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .normalize("NFKD") // handle accents
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/[^a-z0-9\s-]/g, "") // remove invalid chars
        .replace(/\s+/g, "-") // spaces → dashes
        .replace(/-+/g, "-"); // collapse multiple dashes
}
exports.PostSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("title")) {
            return next();
        }
        const baseSlug = createSlug(this.title);
        let slug = baseSlug;
        let counter = 1;
        const PostModel = this.constructor;
        while (yield PostModel.exists({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        this.slug = slug;
        next();
    });
});
/**
 * Post model based on IPost interface
 *
 * @description Creates and exports the Mongoose model for Post
 * @type {Model<IPost>}
 */
const Post = (0, mongoose_1.model)(constant_1.MODEL_NAME.POST, exports.PostSchema);
exports.default = Post;
