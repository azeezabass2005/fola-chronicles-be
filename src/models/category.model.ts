/**
 * Mongoose schema for Category model
 *
 * @description Creates a schema for category which a post belongs to
 */
import {Model, model, Schema} from "mongoose";
import {ITag} from "./interface";
import {MODEL_NAME} from "../common/constant";

export const CategorySchema = new Schema<ITag>(
    {
        /**
         * Title which is the value of the category
         * @type {string}
         * @required
         */
        title: { type: String, required: true, unique: true }
    }
);

CategorySchema.index({ title: 1 }, { unique: true });

/**
 * Category model based on ITag interface
 *
 * @description Creates and exports the Mongoose model for Category
 * @type {Model<ITag>}
 */
const Category: Model<ITag> = model(MODEL_NAME.CATEGORY, CategorySchema);
export default Category;