import { model, Model, Schema, Document } from 'mongoose';
import { MODEL_NAME } from '../common/constant';

export interface IPostLike extends Document {
    postId: Schema.Types.ObjectId;
    likerHash: string;
    createdAt: Date;
}

const PostLikeSchema = new Schema<IPostLike>({
    postId: {
        type: Schema.Types.ObjectId,
        ref: MODEL_NAME.POST,
        required: true,
    },
    likerHash: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

PostLikeSchema.index({ postId: 1, likerHash: 1 }, { unique: true });

const PostLike: Model<IPostLike> = model<IPostLike>(MODEL_NAME.POST_LIKE, PostLikeSchema);
export default PostLike;
