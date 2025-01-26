import { Request, Response, NextFunction } from "express";
import BaseController from "../base-controller";
import ProductService from "../../../services/product.service";
import errorResponseMessage from "../../../common/messages/error-response-message";
import { IProductCreate } from "../../../common/interfaces";

/**
 * Controller handling product-related operations
 * @class ProductController
 * @extends BaseController
 */
class ProductController extends BaseController {
    private productService: ProductService;

    /**
     * Creates an instance of ProductController
     */
    constructor() {
        super();
        this.productService = new ProductService();
        this.setupRoutes();
    }

    /**
     * Sets up routes for product operations
     * @protected
     */
    protected setupRoutes(): void {
        // Create product route
        this.router.post("/", this.createProduct.bind(this));

        // Get products route
        this.router.get("/", this.getProducts.bind(this));

        // Get single product route
        this.router.get("/:id", this.getProductById.bind(this));

        // Update product route
        this.router.put("/:id", this.updateProduct.bind(this));

        // Delete product route
        this.router.delete("/:id", this.deleteProduct.bind(this));
    }

    /**
     * Creates a new product
     * @private
     */
    private async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = res.locals.user;
            const productData: IProductCreate = req.body;

            const product = await this.productService.save({
                ...productData,
                // user: user?._id,
            });

            if (!product) {
                throw new Error("Failed to create product");
            }

            this.sendSuccess(res, {
                product_id: product._id,
                product: product
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Retrieves all products based on query parameters
     * @private
     */
    private async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const products = await this.productService.paginate(req.query, {
                page,
                limit,
                sort: { created_at: -1 },
                populate: ['user']
            });

            this.sendSuccess(res, { products });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Retrieves a single product by ID
     * @private
     */
    private async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await this.productService.findById(req.params.id, {
                populate: ['user']
            });

            if (!product) {
                throw errorResponseMessage.resourceNotFound('Product');
            }

            this.sendSuccess(res, { product });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Updates a product by ID
     * @private
     */
    private async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await this.productService.update(req.params.id, req.body);

            if (!product) {
                throw errorResponseMessage.resourceNotFound('Product');
            }

            this.sendSuccess(res, { product });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Deletes a product by ID
     * @private
     */
    private async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await this.productService.deleteById(req.params.id);

            if (!product) {
                throw errorResponseMessage.resourceNotFound('Product');
            }

            this.sendSuccess(res, { message: 'Product deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

// Export an instance of the controller's router
export default new ProductController().router;