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
const base_controller_1 = __importDefault(require("../base-controller"));
const post_service_1 = __importDefault(require("../../../services/post.service"));
const error_response_message_1 = __importDefault(require("../../../common/messages/error-response-message"));
const validators_1 = require("../../../validators");
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
        this.setupRoutes();
    }
    /**
     * Sets up routes for post operations
     * @protected
     */
    setupRoutes() {
        // Create post route
        this.router.post("/", validators_1.validatePostCreate, this.createPost.bind(this));
        // Get posts route
        this.router.get("/", this.getPosts.bind(this));
        // Get single post route
        this.router.get("/:id", this.getPostById.bind(this));
        // Update post route
        this.router.patch("/:id", this.updatePost.bind(this));
        // Delete post route
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
                const postData = req.body;
                const post = yield this.postService.save(Object.assign(Object.assign({}, postData), { user: user === null || user === void 0 ? void 0 : user._id }));
                if (!post) {
                    throw new Error("Failed to create post");
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
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const posts = yield this.postService.paginate(req.query, {
                    page,
                    limit,
                    sort: { created_at: -1 },
                    populate: ['user']
                });
                this.sendSuccess(res, { posts });
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
                const relatedPosts = yield this.postService.getRelatedPosts(req.params.id, {
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
                const post = yield this.postService.update(req.params.id, req.body);
                if (!post) {
                    throw error_response_message_1.default.resourceNotFound('Post');
                }
                this.sendSuccess(res, { post });
            }
            catch (error) {
                next(error);
            }
        });
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
// Export an instance of the controller's router
exports.default = new PostController().router;
