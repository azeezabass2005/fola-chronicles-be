import {Request, Response, NextFunction} from "express";
import BaseController from "../../base/base-controller";
import PostService from "../../../services/post.service";
import errorResponseMessage from "../../../common/messages/error-response-message";
import {validatePostCreate} from "../../../validators";
import TagService from "../../../services/tag.service";
import CategoryService from "../../../services/category.service";

/**
 * Controller handling post-related operations
 * @class PostController
 * @extends BaseController
 */
class PostController extends BaseController {
    private postService: PostService;
    private tagService: TagService;
    private categoryService: CategoryService;

    /**
     * Creates an instance of PostController
     */
    constructor() {
        super();
        this.postService = new PostService();
        this.categoryService = new CategoryService();
        this.tagService = new TagService();
        this.setupRoutes();
    }

    /**
     * Sets up routes for post operations
     * @protected
     */
    protected setupRoutes(): void {
        // Create post route
        this.router.post("/", validatePostCreate, this.createPost.bind(this));

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
    private async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            console.log("Got to the create post function");
            const user = res.locals.user;
            // const postData: Partial<IPost> = req.body;

            const { category, tags, ...postData } = req.body;

            const tagDocs = await this.tagService.findOrCreateTags(tags);
            const categoryDoc = await this.categoryService.findOrCreateCategory(category);
            console.log(user, postData, "This is the user and postData");
            const post = await this.postService.save({
                ...postData,
                tags: tagDocs.map(tag => tag._id),
                category: categoryDoc._id,
                user: user?._id,
            });
            console.log(post, "This is the post created")

            if (!post) {
                throw new Error("Failed to create post");
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

            const { page, limit, searchTerm, ...otherQueries } = req.query;

            let posts;

            if (searchTerm) {
                posts = await this.postService.searchPosts(
                    searchTerm.toString(),
                    otherQueries,
                    {
                        page: parseInt(page as string) || 1,
                        limit: parseInt(limit as string) || 10,
                        useTextSearch: false
                    }
                );
            } else {
                posts = await this.postService.paginate(otherQueries, {
                    page: parseInt(page as string) || 1,
                    limit: parseInt(limit as string) || 10,
                    sort: { created_at: -1 }
                });
            }

            return this.sendSuccess(res, posts)

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
                populate: ['user']
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
            const post = await this.postService.updateById(req.params.id, req.body);

            if (!post) {
                throw errorResponseMessage.resourceNotFound('Post');
            }

            this.sendSuccess(res, {post});
        } catch (error) {
            next(error);
        }
    }

    /**
     * Deletes a post by ID
     * @private
     */
    private async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const post = await this.postService.deleteById(req.params.id);

            if (!post) {
                throw errorResponseMessage.resourceNotFound('Post');
            }

            this.sendSuccess(res, {message: 'Post deleted successfully'});
        } catch (error) {
            next(error);
        }
    }
}

export default new PostController().router;