import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/base-controller";
import PostService from "../../../services/post.service";
import errorResponseMessage from "../../../common/messages/error-response-message";
import { IPost } from "../../../models/interface";
import { validatePostCreate } from "../../../validators";
import { populate } from "dotenv";
import { PUBLICATION_STATUS } from "../../../common/constant";

/**
 * Controller handling post-related operations
 * @class PostController
 * @extends BaseController
 */
class PostController extends BaseController {
  private postService: PostService;

  /**
   * Creates an instance of PostController
   */
  constructor() {
    super();
    this.postService = new PostService();
    this.setupRoutes();
  }

  /**
   * Sets up routes for post operations
   * @protected
   */
  protected setupRoutes(): void {
    // Get posts route
    this.router.get("/", this.getPosts.bind(this));

    // Get single post route
    // this.router.get("/:id", this.getPostById.bind(this));

    // Get single post by slug
    this.router.get("/:slug", this.getPostBySlug.bind(this));

    // Update post route
    this.router.patch("/:id", this.updatePost.bind(this));
  }

  /**
   * Retrieves all posts based on query parameters
   * @private
   */
  private async getPosts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit, searchTerm, category, status, tags, sort, order } =
        req.query;

      const filters: any = {
        publicationStatus: PUBLICATION_STATUS.PUBLISHED,
      };

      if (category) {
        filters.category = category;
      }

      if (status) {
        filters.status = status;
      }

      if (tags) {
        const tagArray = (tags as string).split(",").filter((t) => t.trim());
        if (tagArray.length > 0) {
          filters.tags = { $in: tagArray };
        }
      }

      const sortField = (sort as string) || "createdAt";
      const sortOrder = (order as string) === "asc" ? 1 : -1;
      const sortOptions: Record<string, any> = { [sortField]: sortOrder };

      let posts;

      if (searchTerm) {
        posts = await this.postService.searchPosts(
          searchTerm.toString(),
          filters,
          {
            page: parseInt(page as string) || 1,
            limit: parseInt(limit as string) || 6,
            useTextSearch: false,
          },
          sortOptions
        );
      } else {
        posts = await this.postService.paginate(filters, {
          page: parseInt(page as string) || 1,
          limit: parseInt(limit as string) || 6,
          sort: sortOptions,
          populate: ["user", "tags", "category"],
        });
      }

      this.sendSuccess(res, { posts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a single post by ID
   * @private
   */
  private async getPostById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const post = await this.postService.findById(req.params.id, {
        populate: ["user"],
      });

      if (!post) {
        throw errorResponseMessage.resourceNotFound("Post");
      }

      const relatedPosts = await this.postService.getRelatedPosts(post, {
        limit: 5,
        includeSameUser: false,
      });
      this.sendSuccess(res, { post, relatedPosts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a single post by slug
   * @private
   */
  private async getPostBySlug(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const post = await this.postService.findOne(
        { slug: req.params.slug },
        {
          populate: ["user", "tags", "category"],
        }
      );

      if (!post) {
        throw errorResponseMessage.resourceNotFound("Post");
      }

      const relatedPosts = await this.postService.getRelatedPosts(post, {
        limit: 5,
        includeSameUser: true,
      });
      this.sendSuccess(res, { post, relatedPosts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates a post by ID
   * @private
   */
  private async updatePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const post = await this.postService.updateById(req.params.id, req.body);

      if (!post) {
        throw errorResponseMessage.resourceNotFound("Post");
      }

      this.sendSuccess(res, { post });
    } catch (error) {
      next(error);
    }
  }
}

export default new PostController().router;
