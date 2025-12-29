import DBService from "../utils/db.utils";
import { IPost } from "../models/interface";
import Post from "../models/post.model";
import { HydratedDocument, PipelineStage } from "mongoose";
import errorResponseMessage from "../common/messages/error-response-message";
import TagService from "./tag.service";
import CategoryService from "./category.service";

/**
 * Service class for User-related database operations
 *
 * @description Extends the generic DBService with User-specific configurations
 * @extends {DBService<IPost>}
 */
class PostService extends DBService<IPost> {
  private tagService: TagService;
  private categoryService: CategoryService;

  /**
   * Creates an instance of PostService
   *
   * @constructor
   * @param {string[]} [populatedFields=[]] - Optional fields to populate during queries
   */
  constructor(populatedFields: string[] = []) {
    super(Post, populatedFields);
    this.tagService = new TagService();
    this.categoryService = new CategoryService();
  }

  /**
   * Calculate time decay score based on post age
   * Newer posts get higher scores
   */
  private getTimeDecayExpression() {
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
  public async getRelatedPosts(
    originalPost: IPost,
    options: {
      limit?: number;
      includeSameUser?: boolean;
      categoryWeight?: number;
      tagWeight?: number;
      textSimilarityWeight?: number;
      engagementWeight?: number;
      timeDecayWeight?: number;
    } = {}
  ): Promise<HydratedDocument<IPost>[]> {
    const {
      limit = 5,
      includeSameUser = false,
      categoryWeight = 3,
      tagWeight = 2,
      textSimilarityWeight = 1.5,
      engagementWeight = 1,
      timeDecayWeight = 0.5,
    } = options;

    // const originalPost = await this.findById(postId, {
    //     populate: ['user']
    // });

    if (!originalPost) {
      throw errorResponseMessage.resourceNotFound("Post");
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          $text: {
            $search: `${originalPost.title} ${originalPost.content}`,
          },
        },
      },

      {
        $match: {
          _id: { $ne: originalPost._id },
          ...(!includeSameUser && originalPost.user
            ? { user: { $ne: originalPost.user } }
            : {}),
        },
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
  }

  /**
   * Increment view count for a post
   */
  public async incrementViewCount(postId: string): Promise<void> {
    await this.updateById(postId, { $inc: { viewCount: 1 } });
  }

  /**
   * Increment like count for a post
   */
  public async updateLikeCount(
    postId: string,
    likeUpdateType = "increment"
  ): Promise<void> {
    if (likeUpdateType === "decrement") {
      await this.updateById(postId, { $inc: { likeCount: 1 } });
    } else {
      await this.updateById(postId, { dec: { likeCount: 1 } });
    }
  }

  /**
   * Search posts with flexible text matching including category and tags
   * @param searchTerm - The term to search for
   * @param filters - Additional filters
   * @param options - Pagination and sorting options
   */
  public async searchPosts(
    searchTerm: string,
    filters: Partial<IPost> = {},
    options: {
      page?: number;
      limit?: number;
      useTextSearch?: boolean;
    } = {},
    sortOptions: Record<string, any> = { createdAt: -1 }
  ) {
    const { page = 1, limit = 10, useTextSearch = false } = options;

    let query: any = { ...filters };

    if (searchTerm?.trim()) {
      const cleanedSearchTerm = searchTerm.trim();

      if (useTextSearch && cleanedSearchTerm.length >= 3) {
        query.$text = { $search: cleanedSearchTerm };
        sortOptions = { score: { $meta: "textScore" }, ...sortOptions };
      } else {
        const escapedSearchTerm = cleanedSearchTerm.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );
        const regex = new RegExp(escapedSearchTerm, "i");

        const [matchingCategories, matchingTags] = await Promise.all([
          this.categoryService.find({ title: regex }, { select: ["_id"] }),
          this.tagService.find({ title: regex }, { select: ["_id"] }),
        ]);

        const categoryIds = matchingCategories.map((c) => c._id);
        const tagIds = matchingTags.map((t) => t._id);

        const searchConditions: any[] = [
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

        if (query.$or || Object.keys(query).length > 0) {
          const existingFilters = { ...query };
          query = {
            $and: [existingFilters, { $or: searchConditions }],
          };
        } else {
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
  }
}

export default PostService;
