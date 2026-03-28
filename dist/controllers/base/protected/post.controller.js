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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../base/base-controller"));
const post_service_1 = __importDefault(require("../../../services/post.service"));
const error_response_message_1 = __importDefault(require("../../../common/messages/error-response-message"));
const validators_1 = require("../../../validators");
const tag_service_1 = __importDefault(require("../../../services/tag.service"));
const category_service_1 = __importDefault(require("../../../services/category.service"));
const subscription_notification_utils_1 = __importDefault(require("../../../utils/subscription-notification.utils"));
const constant_1 = require("../../../common/constant");
const sanitize_utils_1 = require("../../../utils/sanitize.utils");
/**
 * Controller handling post-related operations
 * @class PostController
 * @extends BaseController
 */
class PostController extends base_controller_1.default {
    /**
     * Creates an instance of PostController
     */
    constructor() {
        super();
        this.postService = new post_service_1.default();
        this.categoryService = new category_service_1.default();
        this.tagService = new tag_service_1.default();
        this.subscriptionNotifier = new subscription_notification_utils_1.default();
        this.setupRoutes();
    }
    /**
     * Sets up routes for post operations
     * @protected
     */
    setupRoutes() {
        this.router.post("/", validators_1.validatePostCreate, this.createPost.bind(this));
        this.router.get("/", this.getPosts.bind(this));
        this.router.get("/:id", this.getPostById.bind(this));
        this.router.patch("/:id", this.updatePost.bind(this));
        this.router.delete("/:id", this.deletePost.bind(this));
    }
    /**
     * Creates a new post
     * @private
     */
    createPost(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = res.locals.user;
                const _a = req.body, { category, tags } = _a, postData = __rest(_a, ["category", "tags"]);
                // Sanitize user input to prevent XSS attacks
                const sanitizedPostData = Object.assign(Object.assign({}, postData), { title: (0, sanitize_utils_1.sanitizeInput)(postData.title || ''), description: (0, sanitize_utils_1.sanitizeInput)(postData.description || ''), content: (0, sanitize_utils_1.sanitizeContent)(postData.content || '') });
                const tagDocs = yield this.tagService.findOrCreateTags(tags);
                const categoryDoc = yield this.categoryService.findOrCreateCategory(category);
                const post = yield this.postService.save(Object.assign(Object.assign({}, sanitizedPostData), { tags: tagDocs.map(tag => tag._id), category: categoryDoc._id, user: user === null || user === void 0 ? void 0 : user._id }));
                if (!post) {
                    throw new Error("Failed to create post");
                }
                // Notify subscribers if post is published
                if (post.publicationStatus === constant_1.PUBLICATION_STATUS.PUBLISHED && post.slug) {
                    // Extract excerpt from content (first 200 characters, strip markdown)
                    const excerpt = this.extractExcerpt(post.content || '', 200);
                    // Send notifications asynchronously (don't wait for it)
                    this.subscriptionNotifier.notifySubscribersOfNewPost({
                        title: post.title,
                        excerpt,
                        slug: post.slug,
                    }).catch((error) => {
                        // Log error but don't fail the post creation
                        this.logger.error('Failed to notify subscribers:', { error, postId: post._id });
                    });
                }
                this.sendSuccess(res, {
                    post_id: post._id,
                    post: post
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Retrieves all posts based on query parameters
     * @private
     */
    getPosts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _a = req.query, { page, limit, searchTerm, startDate, endDate, status } = _a, otherQueries = __rest(_a, ["page", "limit", "searchTerm", "startDate", "endDate", "status"]);
                // Add date range filtering
                const filters = Object.assign({}, otherQueries);
                // Map status to publicationStatus
                if (status) {
                    filters.publicationStatus = status;
                }
                if (startDate || endDate) {
                    const dateFilter = {};
                    if (startDate) {
                        dateFilter.$gte = new Date(startDate);
                    }
                    if (endDate) {
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999); // Include the entire end date
                        dateFilter.$lte = end;
                    }
                    filters.createdAt = dateFilter;
                }
                let posts;
                if (searchTerm) {
                    posts = yield this.postService.searchPosts(searchTerm.toString(), filters, {
                        page: parseInt(page) || 1,
                        limit: parseInt(limit) || 10,
                        useTextSearch: false
                    });
                }
                else {
                    posts = yield this.postService.paginate(filters, {
                        page: parseInt(page) || 1,
                        limit: parseInt(limit) || 10,
                        sort: { createdAt: -1 },
                        populate: ["user", "tags", "category"]
                    });
                }
                return this.sendSuccess(res, posts);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Retrieves a single post by ID
     * @private
     */
    getPostById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield this.postService.findById(req.params.id, {
                    populate: ['user']
                });
                if (!post) {
                    throw error_response_message_1.default.resourceNotFound('Post');
                }
                const relatedPosts = yield this.postService.getRelatedPosts(post, {
                    limit: 5,
                    includeSameUser: false
                });
                this.sendSuccess(res, { post, relatedPosts });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Updates a post by ID
     * @private
     */
    updatePost(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingPost = yield this.postService.findById(req.params.id);
                if (!existingPost) {
                    throw error_response_message_1.default.resourceNotFound('Post');
                }
                const _a = req.body, { category, tags } = _a, postData = __rest(_a, ["category", "tags"]);
                // Sanitize user input to prevent XSS attacks
                const sanitizedUpdateData = {};
                if (postData.title !== undefined) {
                    sanitizedUpdateData.title = (0, sanitize_utils_1.sanitizeInput)(postData.title);
                }
                if (postData.description !== undefined) {
                    sanitizedUpdateData.description = (0, sanitize_utils_1.sanitizeInput)(postData.description);
                }
                if (postData.content !== undefined) {
                    sanitizedUpdateData.content = (0, sanitize_utils_1.sanitizeContent)(postData.content);
                }
                if (postData.featuredImage !== undefined) {
                    sanitizedUpdateData.featuredImage = (0, sanitize_utils_1.sanitizeInput)(postData.featuredImage);
                }
                // Handle tags and category updates
                let updateData = Object.assign(Object.assign({}, postData), sanitizedUpdateData);
                if (tags !== undefined && Array.isArray(tags)) {
                    const tagDocs = yield this.tagService.findOrCreateTags(tags);
                    updateData.tags = tagDocs.map(tag => tag._id);
                }
                if (category !== undefined && category !== null) {
                    const categoryDoc = yield this.categoryService.findOrCreateCategory(category);
                    updateData.category = categoryDoc._id;
                }
                const post = yield this.postService.updateById(req.params.id, updateData);
                if (!post) {
                    throw error_response_message_1.default.resourceNotFound('Post');
                }
                // Notify subscribers if post status changed from draft to published
                const wasDraft = existingPost.publicationStatus === constant_1.PUBLICATION_STATUS.DRAFT;
                const isNowPublished = post.publicationStatus === constant_1.PUBLICATION_STATUS.PUBLISHED;
                if (wasDraft && isNowPublished && post.slug) {
                    // Extract excerpt from content
                    const excerpt = this.extractExcerpt(post.content || '', 200);
                    // Send notifications asynchronously (don't wait for it)
                    this.subscriptionNotifier.notifySubscribersOfNewPost({
                        title: post.title,
                        excerpt,
                        slug: post.slug,
                    }).catch((error) => {
                        // Log error but don't fail the post update
                        this.logger.error('Failed to notify subscribers:', { error, postId: post._id });
                    });
                }
                this.sendSuccess(res, { post });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Extracts an excerpt from markdown content
     * @private
     * @param {string} content Markdown content
     * @param {number} maxLength Maximum length of excerpt
     * @returns {string} Plain text excerpt
     */
    extractExcerpt(content, maxLength = 200) {
        if (!content)
            return '';
        // Remove markdown syntax
        const plainText = content
            .replace(/[#_*~`>!-]/g, '') // remove common markdown symbols
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // keep link text only
            .replace(/!\[.*\]\([^)]+\)/g, '') // remove images
            .replace(/```[\s\S]*?```/g, '') // remove code blocks
            .replace(/`[^`]+`/g, '') // remove inline code
            .replace(/>\s+/g, '') // remove blockquote markers
            .replace(/\s+/g, ' ') // collapse whitespace
            .trim();
        if (plainText.length <= maxLength) {
            return plainText;
        }
        // Truncate at word boundary
        const truncated = plainText.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
    }
    /**
     * Deletes a post by ID
     * @private
     */
    deletePost(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield this.postService.deleteById(req.params.id);
                if (!post) {
                    throw error_response_message_1.default.resourceNotFound('Post');
                }
                this.sendSuccess(res, { message: 'Post deleted successfully' });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new PostController().router;
