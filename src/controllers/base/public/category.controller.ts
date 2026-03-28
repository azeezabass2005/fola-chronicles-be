/**
 * Controller handling category-related operations
 * @class CategoryController
 * @extends BaseController
 */ import CategoryService from "../../../services/category.service";
import BaseController from "../base-controller";
import {validateTagCreate} from "../../../validators";
import {Request, Response, NextFunction} from "express";
import {ITag} from "../../../models/interface";

class CategoryController extends BaseController {
    private categoryService: CategoryService;

    /**
     * Creates an instance of the CategoryController
     */
    constructor() {
        super();
        this.categoryService = new CategoryService();
        this.setupRoutes();
    }

    /**
     * Sets up routes for category operations
     * @protected
     */
    protected setupRoutes(): void {
        // Gets category route (public)
        this.router.get("/", this.getCategories.bind(this));
    }

    /**
     * Creates a new category
     * @private
     */
    private async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categoryData: Partial<ITag> = req.body;
            const category = await this.categoryService.save({
                ...categoryData,
            });
            if(!category) {
                throw new Error("Failed to create category");
            }

            this.sendSuccess(res, {
                category: category,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Retrieves all posts based on query parameters
     * @private
     */
    private async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categories = await this.categoryService.find();
            this.sendSuccess(res, {categories})
        } catch (error) {
            next(error);
        }
    }
}

export default new CategoryController().router;