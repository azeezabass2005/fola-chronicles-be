import { Schema, model, Model } from 'mongoose';
import { IUser } from './interface';
import { MODEL_NAME } from '../common/constant';

/**
 * Mongoose schema for User model
 *
 * @description Creates a schema for user authentication and basic information
 * @remarks
 * - Includes timestamps for creation and update tracking
 * - Enables virtual property transformations
 */
export const UserSchema = new Schema<IUser>(
    {
        /**
         * Username for user authentication
         * @type {string}
         * @required
         */
        username: { type: String, required: true },

        /**
         * Hashed password for user authentication
         * @type {string}
         * @required
         */
        password: { type: String, required: true },

        /**
         * Email for user authentication
         * @type {string}
         * @required
         */
        email: { type: String, required: true }
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
 * User model based on IUser interface
 *
 * @description Creates and exports the Mongoose model for User
 * @type {Model<IUser>}
 */
const User: Model<IUser> = model<IUser>(MODEL_NAME.USER, UserSchema);
export default User;