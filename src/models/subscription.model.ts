import { Schema, model, Model } from 'mongoose';
import { ISubscription } from './interface';
import { MODEL_NAME } from '../common/constant';

/**
 * Mongoose schema for Subscription model
 *
 * @description Creates a schema for email subscriptions
 * @remarks
 * - Includes timestamps for creation and update tracking
 * - Enables virtual property transformations
 */
export const SubscriptionSchema = new Schema<ISubscription>(
    {
        /**
         * Email address of the subscriber
         * @type {string}
         * @required
         * @unique
         */
        email: { 
            type: String, 
            required: true, 
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
        },

        /**
         * Whether the subscription is active
         * @type {boolean}
         * @default true
         */
        isActive: { 
            type: Boolean, 
            default: true 
        },

        /**
         * Whether the subscription has been confirmed
         * @type {boolean}
         * @default false
         */
        isConfirmed: { 
            type: Boolean, 
            default: false 
        },

        /**
         * Token for confirming subscription
         * @type {string}
         */
        confirmationToken: { 
            type: String 
        },

        /**
         * Date when subscription was confirmed
         * @type {Date}
         */
        confirmedAt: { 
            type: Date 
        },

        /**
         * Date when subscription was unsubscribed
         * @type {Date}
         */
        unsubscribedAt: { 
            type: Date 
        },

        /**
         * Date when subscription was created
         * @type {Date}
         * @default Date.now
         */
        subscribedAt: { 
            type: Date, 
            default: Date.now 
        },
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
 * Index for faster email lookups
 */
SubscriptionSchema.index({ email: 1 });
SubscriptionSchema.index({ confirmationToken: 1 });
SubscriptionSchema.index({ isActive: 1, isConfirmed: 1 });

/**
 * Subscription model based on ISubscription interface
 *
 * @description Creates and exports the Mongoose model for Subscription
 * @type {Model<ISubscription>}
 */
const Subscription = model<ISubscription>(MODEL_NAME.SUBSCRIPTION || 'Subscription', SubscriptionSchema);

export default Subscription;
