import DBService from '../utils/db.utils';
import { IProduct } from '../models/interface';
import Product from '../models/product.model';

/**
 * Service class for User-related database operations
 *
 * @description Extends the generic DBService with User-specific configurations
 * @extends {DBService<IProduct>}
 */
class ProductService extends DBService<IProduct> {
    /**
     * Creates an instance of ProductService
     *
     * @constructor
     * @param {string[]} [populatedFields=[]] - Optional fields to populate during queries
     * @example
     * // Create a ProductService with populated references
     * new ProductService(['category', 'relatedProducts'])
     */
    constructor(populatedFields: string[] = []) {
        // Initialize the service with User model and optional population fields
        super(Product, populatedFields);
    }
}

export default ProductService;