import { Schema, model, Model } from 'mongoose';
import { IProduct } from './interface';
import { MODEL_NAME } from '../common/constant';

/**
 * Mongoose schema for Product model
 *
 * @description Creates a schema for product
 * @remarks
 * - Includes timestamps for creation and update tracking
 * - Enables virtual property transformations
 */
export const ProductSchema = new Schema<IProduct>(
    {
        /**
         * Product Name for easy Identification
         * @type {string}
         * @required
         */
        productName: { type: String, required: true },

        /**
         * Product price
         * @type {string}
         * @required
         */
        price: { type: Number, required: true },
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
 * Product model based on IProduct interface
 *
 * @description Creates and exports the Mongoose model for Product
 * @type {Model<IProduct>}
 */
const Product: Model<IProduct> = model<IProduct>(MODEL_NAME.PRODUCT, ProductSchema);
export default Product;