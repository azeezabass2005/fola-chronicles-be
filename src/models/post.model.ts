import {model, Model, Schema} from 'mongoose';
import {IPost, PublicationStatus} from './interface';
import {MODEL_NAME, PUBLICATION_STATUS} from '../common/constant';
import paginate from "mongoose-paginate-v2"

/**
 * Mongoose schema for Post model
 *
 * @description Creates a schema for post
 * @remarks
 * - Includes timestamps for creation and update tracking
 * - Enables virtual property transformations
 */
export const PostSchema = new Schema<IPost>(
    {
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
        tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],

        /**
         * Category of the post
         * @type {Schema.Types.ObjectId}
         * @required
         */
        category: { type: Schema.Types.ObjectId, ref: "Category", required: true },

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
        user: { type: Schema.Types.ObjectId, ref: MODEL_NAME.USER, required: true },

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
        publicationStatus: { type: String, enum: Object.values(PUBLICATION_STATUS), default: PUBLICATION_STATUS.DRAFT }

    },
    {
        /** Enable virtual properties when converting to plain object */
        toObject: { virtuals: true },

        /** Enable virtual properties when converting to JSON */
        toJSON: { virtuals: true },

        /** Automatically manage createdAt and updatedAt timestamps */
        timestamps: true,
    }
);

/**
 * Add text index for search
 * @description Adds a text index to the title and content fields
 */
PostSchema.index({ title: 'text', content: 'text', category: 'text', tags: 'text', slug: 'text' });

PostSchema.plugin(paginate);


PostSchema.virtual('readingTime').get(function() {
    if (!this.content) return 0;

    const plainText = this.content
        .replace(/[#_*~`>!-]/g, '')              // remove common markdown symbols
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // keep link text only
        .replace(/!\[.*\]\([^)]+\)/g, '')        // remove images
        .replace(/```[\s\S]*?```/g, '')          // remove code blocks
        .replace(/`[^`]+`/g, '')                 // remove inline code
        .replace(/>\s+/g, '')                    // remove blockquote markers
        .replace(/\s+/g, ' ')                    // collapse whitespace
        .trim();

    const words = plainText.trim().split(/\s+/).length;

    return Math.ceil(words / 200)
})

function createSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .normalize("NFKD")                 // handle accents
        .replace(/[\u0300-\u036f]/g, "")   // remove diacritics
        .replace(/[^a-z0-9\s-]/g, "")      // remove invalid chars
        .replace(/\s+/g, "-")              // spaces → dashes
        .replace(/-+/g, "-");              // collapse multiple dashes
}

PostSchema.pre("save", async function (next) {
    if (!this.isModified("title")) {
        return next();
    }

    const baseSlug = createSlug(this.title);
    let slug = baseSlug;
    let counter = 1;

    const PostModel = this.constructor as Model<IPost>;

    while (await PostModel.exists({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    this.slug = slug;
    next();
});



/**
 * Post model based on IPost interface
 *
 * @description Creates and exports the Mongoose model for Post
 * @type {Model<IPost>}
 */
const Post: Model<IPost> = model<IPost>(MODEL_NAME.POST, PostSchema);
export default Post;