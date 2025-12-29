/**
 * Service class for Tag-related database operations
 *
 * @description Extends the generic DBService with Tag-specific configurations
 * @extends {DBService<ITag>}
 */
import DBService from "../utils/db.utils";
import {ITag} from "../models/interface";
import Category from "../models/category.model";

class CategoryService extends DBService<ITag> {
    /**
     * Creates an instance of CategoryService
     *
     * @constructor
     */
    constructor() {
        // Initialize the service with the Category model
        super(Category, [])
    }

    async findOrCreateCategory(category: string) {
        return await Category.findOneAndUpdate(
            { title: category?.toLowerCase() },
            { $setOnInsert: { title: category.toLowerCase() } },
            { upsert: true, new: true }
        )
    }
}

export default CategoryService;