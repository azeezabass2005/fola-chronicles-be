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
const db_utils_1 = __importDefault(require("../utils/db.utils"));
const post_model_1 = __importDefault(require("../models/post.model"));
const error_response_message_1 = __importDefault(require("../common/messages/error-response-message"));
const tag_service_1 = __importDefault(require("./tag.service"));
const category_service_1 = __importDefault(require("./category.service"));
/**
 * Service class for User-related database operations
 *
 * @description Extends the generic DBService with User-specific configurations
 * @extends {DBService<IPost>}
 */
class PostService extends db_utils_1.default {
    /**
     * Creates an instance of PostService
     *
     * @constructor
     * @param {string[]} [populatedFields=[]] - Optional fields to populate during queries
     */
    constructor(populatedFields = []) {
        // Initialize the service with User model and optional population fields
        super(post_model_1.default, populatedFields);
        this.tagService = new tag_service_1.default();
        this.categoryService = new category_service_1.default();
    }
    /**
     * Calculate time decay score based on post age
     * Newer posts get higher scores
     */
    getTimeDecayExpression() {
        const DAY_IN_MS = 24 * 60 * 60 * 1000;
        return {
            $divide: [
                1,
                {
                    $add: [
                        1,
                        {
                            $divide: [{ $subtract: [new Date(), "$publishedAt"] }, DAY_IN_MS],
                        },
                    ],
                },
            ],
        };
    }
    /**
     * Find posts related to a given post based on tags and other criteria
     *
     * @param {string} postId - ID of the post to find related content for
     * @param {Object} options - Options for customizing related posts query
     * @param {number} options.limit - Maximum number of related posts to return
     * @param {boolean} options.includeSameUser - Whether to include posts from the same user
     * @returns {Promise<HydratedDocument<IPost>[]>} Array of related posts
     */
    getRelatedPosts(originalPost_1) {
        return __awaiter(this, arguments, void 0, function* (originalPost, options = {}) {
            const { limit = 5, includeSameUser = false, categoryWeight = 3, // Category matching is important
            tagWeight = 2, // Tag matching is also significant
            textSimilarityWeight = 1.5, // Text similarity adds relevance
            engagementWeight = 1, // Engagement provides social proof
            timeDecayWeight = 0.5, // Time decay slightly influences ranking
             } = options;
            // const originalPost = await this.findById(postId, {
            //     populate: ['user']
            // });
            if (!originalPost) {
                throw error_response_message_1.default.resourceNotFound("Post");
            }
            const pipeline = [
                {
                    $match: {
                        $text: {
                            $search: `${originalPost.title} ${originalPost.content}`,
                        },
                    },
                },
                {
                    $match: Object.assign({ _id: { $ne: originalPost._id } }, (!includeSameUser && originalPost.user
                        ? { user: { $ne: originalPost.user } }
                        : {})),
                },
                {
                    $addFields: {
                        categoryScore: {
                            $cond: {
                                if: { $eq: ["$category", originalPost.category] },
                                then: categoryWeight,
                                else: 0,
                            },
                        },
                        tagScore: {
                            $multiply: [
                                {
                                    $size: {
                                        $setIntersection: ["$tags", originalPost.tags || []],
                                    },
                                },
                                tagWeight,
                            ],
                        },
                        textScore: {
                            $multiply: [{ $meta: "textScore" }, textSimilarityWeight],
                        },
                        engagementScore: {
                            $multiply: [
                                {
                                    $divide: [
                                        { $add: ["$viewCount", { $multiply: ["$likeCount", 2] }] },
                                        100,
                                    ],
                                },
                                engagementWeight,
                            ],
                        },
                        timeDecayScore: {
                            $multiply: [this.getTimeDecayExpression(), timeDecayWeight],
                        },
                    },
                },
                {
                    $addFields: {
                        finalScore: {
                            $add: [
                                "$categoryScore",
                                "$tagScore",
                                "$textScore",
                                "$engagementScore",
                                "$timeDecayScore",
                            ],
                        },
                    },
                },
                { $sort: { finalScore: -1 } },
                { $limit: limit },
            ];
            return this.aggregate(pipeline);
        });
    }
    /**
     * Increment view count for a post
     */
    incrementViewCount(postId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateById(postId, { $inc: { viewCount: 1 } });
        });
    }
    /**
     * Increment like count for a post
     */
    updateLikeCount(postId_1) {
        return __awaiter(this, arguments, void 0, function* (postId, likeUpdateType = "increment") {
            if (likeUpdateType === "decrement") {
                yield this.updateById(postId, { $inc: { likeCount: 1 } });
            }
            else {
                yield this.updateById(postId, { dec: { likeCount: 1 } });
            }
        });
    }
    /**
     * Search posts with flexible text matching including category and tags
     * @param searchTerm - The term to search for
     * @param filters - Additional filters
     * @param options - Pagination and sorting options
     */
    searchPosts(searchTerm_1) {
        return __awaiter(this, arguments, void 0, function* (searchTerm, filters = {}, options = {}, sortOptions = { createdAt: -1 }) {
            const { page = 1, limit = 10, useTextSearch = false } = options;
            let query = Object.assign({}, filters);
            if (searchTerm === null || searchTerm === void 0 ? void 0 : searchTerm.trim()) {
                const cleanedSearchTerm = searchTerm.trim();
                if (useTextSearch && cleanedSearchTerm.length >= 3) {
                    query.$text = { $search: cleanedSearchTerm };
                    sortOptions = Object.assign({ score: { $meta: "textScore" } }, sortOptions);
                }
                else {
                    const escapedSearchTerm = cleanedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    const regex = new RegExp(escapedSearchTerm, "i");
                    // First, find matching categories and tags
                    const [matchingCategories, matchingTags] = yield Promise.all([
                        this.categoryService.find({ title: regex }, { select: ["_id"] }),
                        this.tagService.find({ title: regex }, { select: ["_id"] }),
                    ]);
                    const categoryIds = matchingCategories.map((c) => c._id);
                    const tagIds = matchingTags.map((t) => t._id);
                    // Build $or conditions for search
                    const searchConditions = [
                        { title: regex },
                        { content: regex },
                        { slug: regex },
                    ];
                    if (categoryIds.length > 0) {
                        searchConditions.push({ category: { $in: categoryIds } });
                    }
                    if (tagIds.length > 0) {
                        searchConditions.push({ tags: { $in: tagIds } });
                    }
                    // Combine existing filters with search using $and
                    if (query.$or || Object.keys(query).length > 0) {
                        const existingFilters = Object.assign({}, query);
                        query = {
                            $and: [existingFilters, { $or: searchConditions }],
                        };
                    }
                    else {
                        query.$or = searchConditions;
                    }
                }
            }
            return this.paginate(query, {
                page,
                limit,
                sort: sortOptions,
                populate: ["user", "category", "tags"],
            });
        });
    }
}
exports.default = PostService;
