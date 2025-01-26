"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSchema = void 0;
const mongoose_1 = require("mongoose");
const constant_1 = require("../common/constant");
/**
 * Mongoose schema for Product model
 *
 * @description Creates a schema for product
 * @remarks
 * - Includes timestamps for creation and update tracking
 * - Enables virtual property transformations
 */
exports.ProductSchema = new mongoose_1.Schema({
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
}, {
    /** Enable virtual properties when converting to plain object */
    toObject: { virtuals: true },
    /** Enable virtual properties when converting to JSON */
    toJSON: { virtuals: true },
    /** Automatically manage createdAt and updatedAt timestamps */
    timestamps: true,
});
/**
 * Product model based on IProduct interface
 *
 * @description Creates and exports the Mongoose model for Product
 * @type {Model<IProduct>}
 */
const Product = (0, mongoose_1.model)(constant_1.MODEL_NAME.PRODUCT, exports.ProductSchema);
exports.default = Product;
