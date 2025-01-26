"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../base-controller"));
const product_service_1 = __importDefault(require("../../../services/product.service"));
const error_response_message_1 = __importDefault(require("../../../common/messages/error-response-message"));
/**
 * Controller handling product-related operations
 * @class ProductController
 * @extends BaseController
 */
class ProductController extends base_controller_1.default {
    /**
     * Creates an instance of ProductController
     */
    constructor() {
        super();
        this.productService = new product_service_1.default();
        this.setupRoutes();
    }
    /**
     * Sets up routes for product operations
     * @protected
     */
    setupRoutes() {
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
    createProduct(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = res.locals.user;
                const productData = req.body;
                const product = yield this.productService.save(Object.assign({}, productData));
                if (!product) {
                    throw new Error("Failed to create product");
                }
                this.sendSuccess(res, {
                    product_id: product._id,
                    product: product
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Retrieves all products based on query parameters
     * @private
     */
    getProducts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const products = yield this.productService.paginate(req.query, {
                    page,
                    limit,
                    sort: { created_at: -1 },
                    populate: ['user']
                });
                this.sendSuccess(res, { products });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Retrieves a single product by ID
     * @private
     */
    getProductById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield this.productService.findById(req.params.id, {
                    populate: ['user']
                });
                if (!product) {
                    throw error_response_message_1.default.resourceNotFound('Product');
                }
                this.sendSuccess(res, { product });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Updates a product by ID
     * @private
     */
    updateProduct(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield this.productService.update(req.params.id, req.body);
                if (!product) {
                    throw error_response_message_1.default.resourceNotFound('Product');
                }
                this.sendSuccess(res, { product });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Deletes a product by ID
     * @private
     */
    deleteProduct(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield this.productService.deleteById(req.params.id);
                if (!product) {
                    throw error_response_message_1.default.resourceNotFound('Product');
                }
                this.sendSuccess(res, { message: 'Product deleted successfully' });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
// Export an instance of the controller's router
exports.default = new ProductController().router;
