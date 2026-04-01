import {Request, Response, NextFunction} from "express";
import BaseController from "../../base/base-controller";
import PostService from "../../../services/post.service";
import errorResponseMessage from "../../../common/messages/error-response-message";
import {validatePostCreate} from "../../../validators";
import TagService from "../../../services/tag.service";
import CategoryService from "../../../services/category.service";
import SubscriptionNotificationUtils from "../../../utils/subscription-notification.utils";
import { PUBLICATION_STATUS } from "../../../common/constant";
import { sanitizeInput } from "../../../utils/sanitize.utils";

/**
 * Controller handling post-related operations
 * @class PostController
 * @extends BaseController
 */
class PostController extends BaseController {
    private postService: PostService;
    private tagService: TagService;
    private categoryService: CategoryService;
    private subscriptionNotifier: SubscriptionNotificationUtils;

    /**
     * Creates an instance of PostController
     */
    constructor() {
        super();
        this.postService = new PostService();
        this.categoryService = new CategoryService();
        this.tagService = new TagService();
        this.subscriptionNotifier = new SubscriptionNotificationUtils();
        this.setupRoutes();
    }

    /**
     * Sets up routes for post operations
     * @protected
     */
    protected setupRoutes(): void {
        this.router.post("/", validatePostCreate, this.createPost.bind(this));
        this.router.get("/", this.getPosts.bind(this));
        this.router.get("/by-slug/:slug", this.getPostBySlug.bind(this));
        this.router.get("/:id", this.getPostById.bind(this));
        this.router.patch("/:id", this.updatePost.bind(this));
        this.router.delete("/:id", this.deletePost.bind(this));
    }

    /**
     * Creates a new post
     * @private
     */
    private async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = res.locals.user;
            const { category, tags, ...postData } = req.body;

            // Sanitize user input to prevent XSS attacks
            const sanitizedPostData = {
                ...postData,
                title: sanitizeInput(postData.title || ''),
                description: sanitizeInput(postData.description || ''),
                content: postData.content || '',
            };

            const tagDocs = await this.tagService.findOrCreateTags(tags);
            const categoryDoc = await this.categoryService.findOrCreateCategory(category);
            const post = await this.postService.save({
                ...sanitizedPostData,
                tags: tagDocs.map(tag => tag._id),
                category: categoryDoc._id,
                user: user?._id,
            });

            if (!post) {
                throw new Error("Failed to create post");
            }

            // Notify subscribers if post is published
            if (post.publicationStatus === PUBLICATION_STATUS.PUBLISHED && post.slug) {
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
        } catch (error) {
            next(error);
        }
    }

    /**
     * Retrieves all posts based on query parameters
     * @private
     */
    private async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {

            const { page, limit, searchTerm, startDate, endDate, status, ...otherQueries } = req.query;

            // Add date range filtering
            const filters: Record<string, unknown> = { ...otherQueries };
            
            // Map status to publicationStatus
            if (status) {
                filters.publicationStatus = status;
            }
            
            if (startDate || endDate) {
                const dateFilter: Record<string, Date> = {};
                if (startDate) {
                    dateFilter.$gte = new Date(startDate as string);
                }
                if (endDate) {
                    const end = new Date(endDate as string);
                    end.setHours(23, 59, 59, 999); // Include the entire end date
                    dateFilter.$lte = end;
                }
                filters.createdAt = dateFilter;
            }

            let posts;

            if (searchTerm) {
                posts = await this.postService.searchPosts(
                    searchTerm.toString(),
                    filters,
                    {
                        page: parseInt(page as string) || 1,
                        limit: Math.min(parseInt(limit as string) || 10, 50),
                        useTextSearch: false
                    }
                );
            } else {
                posts = await this.postService.paginate(filters, {
                    page: parseInt(page as string) || 1,
                    limit: Math.min(parseInt(limit as string) || 10, 50),
                    sort: { createdAt: -1 },
                    populate: ["user", "tags", "category"]
                });
            }

            return this.sendSuccess(res, posts)

        } catch (error) {
            next(error);
        }
    }

    /**
     * Retrieves a single post by slug
     * @private
     */
    private async getPostBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const post = await this.postService.findOne(
                { slug: req.params.slug },
                { populate: ['user', 'tags', 'category'] }
            );

            if (!post) {
                throw errorResponseMessage.resourceNotFound('Post');
            }

            this.sendSuccess(res, { post });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Retrieves a single post by ID
     * @private
     */
    private async getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const post = await this.postService.findById(req.params.id, {
                populate: ['user', 'tags', 'category']
            });

            if (!post) {
                throw errorResponseMessage.resourceNotFound('Post');
            }

            const relatedPosts = await this.postService.getRelatedPosts(post, {
                limit: 5,
                includeSameUser: false
            });
            this.sendSuccess(res, {post, relatedPosts});
        } catch (error) {
            next(error);
        }
    }

    /**
     * Updates a post by ID
     * @private
     */
    private async updatePost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = res.locals.user;
            const existingPost = await this.postService.findById(req.params.id);

            if (!existingPost) {
                throw errorResponseMessage.resourceNotFound('Post');
            }

            if (existingPost.user?.toString() !== user._id?.toString()) {
                throw errorResponseMessage.unauthorized("You can only modify your own posts");
            }

            const { category, tags, ...postData } = req.body;

            // Sanitize user input to prevent XSS attacks
            const sanitizedUpdateData: Record<string, unknown> = {};
            if (postData.title !== undefined) {
                sanitizedUpdateData.title = sanitizeInput(postData.title);
            }
            if (postData.description !== undefined) {
                sanitizedUpdateData.description = sanitizeInput(postData.description);
            }
            if (postData.content !== undefined) {
                sanitizedUpdateData.content = postData.content;
            }
            if (postData.featuredImage !== undefined) {
                sanitizedUpdateData.featuredImage = sanitizeInput(postData.featuredImage);
            }

            // Handle tags and category updates
            let updateData: Record<string, unknown> = { ...postData, ...sanitizedUpdateData };
            
            if (tags !== undefined && Array.isArray(tags)) {
                const tagDocs = await this.tagService.findOrCreateTags(tags);
                updateData.tags = tagDocs.map(tag => tag._id);
            }
            
            if (category !== undefined && category !== null) {
                const categoryDoc = await this.categoryService.findOrCreateCategory(category);
                updateData.category = categoryDoc._id;
            }

            const post = await this.postService.updateById(req.params.id, updateData);

            if (!post) {
                throw errorResponseMessage.resourceNotFound('Post');
            }

            // Notify subscribers if post status changed from draft to published
            const wasDraft = existingPost.publicationStatus === PUBLICATION_STATUS.DRAFT;
            const isNowPublished = post.publicationStatus === PUBLICATION_STATUS.PUBLISHED;
            
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

            this.sendSuccess(res, {post});
        } catch (error) {
            next(error);
        }
    }

    /**
     * Extracts an excerpt from markdown content
     * @private
     * @param {string} content Markdown content
     * @param {number} maxLength Maximum length of excerpt
     * @returns {string} Plain text excerpt
     */
    private extractExcerpt(content: string, maxLength: number = 200): string {
        if (!content) return '';

        // Remove markdown syntax
        const plainText = content
            .replace(/[#_*~`>!-]/g, '')              // remove common markdown symbols
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // keep link text only
            .replace(/!\[.*\]\([^)]+\)/g, '')        // remove images
            .replace(/```[\s\S]*?```/g, '')          // remove code blocks
            .replace(/`[^`]+`/g, '')                 // remove inline code
            .replace(/>\s+/g, '')                    // remove blockquote markers
            .replace(/\s+/g, ' ')                    // collapse whitespace
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
    private async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = res.locals.user;
            const existingPost = await this.postService.findById(req.params.id);

            if (!existingPost) {
                throw errorResponseMessage.resourceNotFound('Post');
            }

            if (existingPost.user?.toString() !== user._id?.toString()) {
                throw errorResponseMessage.unauthorized("You can only delete your own posts");
            }

            await this.postService.deleteById(req.params.id);

            this.sendSuccess(res, {message: 'Post deleted successfully'});
        } catch (error) {
            next(error);
        }
    }
}

export default new PostController().router;