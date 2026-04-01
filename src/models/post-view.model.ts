import { model, Model, Schema, Document } from 'mongoose';
import { MODEL_NAME } from '../common/constant';

export interface IPostView extends Document {
    postId: Schema.Types.ObjectId;
    viewerHash: string;
    viewedAt: Date;
}

const PostViewSchema = new Schema<IPostView>({
    postId: {
        type: Schema.Types.ObjectId,
        ref: MODEL_NAME.POST,
        required: true,
    },
    viewerHash: {
        type: String,
        required: true,
    },
    viewedAt: {
        type: Date,
        default: Date.now,
        expires: 86400, // TTL: auto-delete after 24 hours
    },
});

PostViewSchema.index({ postId: 1, viewerHash: 1 }, { unique: true });

const PostView: Model<IPostView> = model<IPostView>(MODEL_NAME.POST_VIEW, PostViewSchema);
export default PostView;
