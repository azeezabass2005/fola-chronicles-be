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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A generic database service that provides comprehensive CRUD operations
 * with enhanced type safety and error handling
 * @template T The type of the Mongoose model
 */
class DBService {
    /**
     * Creates an instance of ImprovedDBService
     * @param {Model<T>} model The Mongoose model to work with
     * @param {string[]} [populatedPaths=[]] Optional default paths to populate
     */
    constructor(model, populatedPaths = []) {
        this.Model = model;
        this.defaultPopulatedPaths = populatedPaths;
    }
    /**
     * Centralized error handling method for database operations
     * @template R The return type of the operation
     * @param {() => Promise<R>} operation The database operation to execute
     * @param {string} [errorMessage='Database operation failed'] Custom error message
     * @returns {Promise<R>} The result of the operation
     * @throws {Error} Throws an error if the operation fails
     */
    executeWithErrorHandling(operation_1) {
        return __awaiter(this, arguments, void 0, function* (operation, errorMessage = 'Database operation failed') {
            try {
                return yield operation();
            }
            catch (error) {
                console.error(errorMessage, error);
                throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : error}`);
            }
        });
    }
    /**
     * Saves a new document with optional validation
     * @param {Partial<T>} data The data to save
     * @param {ClientSession} [session=null] Optional database session for transactions
     * @param {boolean} [validate=true] Whether to run validation before saving
     * @returns {Promise<HydratedDocument<T>>} The saved document
     */
    save(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, session = null, validate = true) {
            return this.executeWithErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
                const model = new this.Model(data);
                if (validate) {
                    yield model.validate();
                }
                return model.save({ session });
            }), 'Save operation failed');
        });
    }
    /**
     * Creates a document using Mongoose create method
     * @param {any} data Document to create
     * @param {ClientSession} [session=null] Optional database session
     * @returns {Promise<any>} Created document
     */
    create(data, session = null) {
        return this.executeWithErrorHandling(() => this.Model.create(data), 'Create operation failed');
    }
    /**
     * Counts documents matching a query
     * @param {any} [query={}] Query to filter documents
     * @returns {Promise<number>} Number of matching documents
     */
    count(query = {}) {
        return this.executeWithErrorHandling(() => this.Model.countDocuments(query), 'Count operation failed');
    }
    /**
     * Updates a document by ID
     * @param {string} id Document ID to update
     * @param {any} data Update data
     * @param {ClientSession} [session=null] Optional database session
     * @returns {Promise<any>} Updated document
     */
    update(id, data, session = null) {
        return this.executeWithErrorHandling(() => this.Model.findByIdAndUpdate(id, data, { new: true }).session(session), 'Update by ID failed');
    }
    /**
     * Finds documents with flexible querying options
     * @param {FilterQuery<T>} [query={}] The query to filter documents
     * @param {Object} [options={}] Additional find options
     * @param {Record<string, 1 | -1>} [options.sort] Sorting configuration
     * @param {number} [options.limit] Maximum number of documents to return
     * @param {ClientSession} [options.session] Database session
     * @param {string[]} [options.select] Fields to select
     * @param {string[]} [options.populate] Paths to populate
     * @returns {Promise<HydratedDocument<T>[]>} Array of found documents
     */
    find() {
        return __awaiter(this, arguments, void 0, function* (query = {}, options = {}) {
            return this.executeWithErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
                const { sort = { created_at: -1 }, limit = 300, session = null, select = [], populate = this.defaultPopulatedPaths } = options;
                return this.Model.find(query)
                    .populate(populate)
                    .session(session)
                    .limit(limit)
                    .sort(sort)
                    .select(select.join(' '));
            }), 'Find operation failed');
        });
    }
    /**
     * Finds a document by its ID with optional population and field selection
     * @param {string} id The document ID to find
     * @param {Object} [options={}] Additional query options
     * @param {ClientSession} [options.session] Database session
     * @param {string[]} [options.select] Fields to select
     * @param {string[]} [options.populate] Paths to populate
     * @returns {Promise<HydratedDocument<T> | null>} Found document or null
     */
    findById(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, options = {}) {
            return this.executeWithErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
                const { session = null, select = [], populate = this.defaultPopulatedPaths } = options;
                return this.Model.findById(id)
                    .session(session)
                    .populate(populate)
                    .select(select.join(' '));
            }), 'Find by ID operation failed');
        });
    }
    /**
     * Finds a single document with optional population and field selection
     * @param {FilterQuery<T>} query The query to find the document
     * @param {Object} [options={}] Additional query options
     * @param {ClientSession} [options.session] Database session
     * @param {string[]} [options.select] Fields to select
     * @param {string[]} [options.populate] Paths to populate
     * @returns {Promise<HydratedDocument<T> | null>} Found document or null
     */
    findOne(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, options = {}) {
            return this.executeWithErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
                const { session = null, select = [], populate = this.defaultPopulatedPaths } = options;
                return this.Model.findOne(query)
                    .session(session)
                    .populate(populate)
                    .select(select.join(' '));
            }), 'Find one operation failed');
        });
    }
    /**
     * Performs paginated query with advanced options
     * @param {FilterQuery<T>} [query={}] The query to filter documents
     * @param {Object} [options={}] Pagination and query options
     * @param {number} [options.page=1] Page number
     * @param {number} [options.limit=10] Documents per page
     * @param {Record<string, 1 | -1>} [options.sort] Sorting configuration
     * @param {string[]} [options.select] Fields to select
     * @param {string[]} [options.populate] Paths to populate
     * @returns {Promise<PaginationResult<T>>} Paginated result
     */
    paginate() {
        return __awaiter(this, arguments, void 0, function* (query = {}, options = {}) {
            return this.executeWithErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
                const { page = 1, limit = 10, sort = { created_at: -1 }, select = [], populate = this.defaultPopulatedPaths } = options;
                const customLabels = {
                    totalDocs: 'itemsCount',
                    docs: 'data',
                    limit: 'perPage',
                    page: 'currentPage',
                    nextPage: 'next',
                    prevPage: 'prev',
                    totalPages: 'pageCount',
                    pagingCounter: 'serialNumber',
                    meta: 'paginator'
                };
                const paginationOptions = {
                    page,
                    limit,
                    sort,
                    customLabels,
                    populate,
                    select: select.join(' ')
                };
                // @ts-ignore - mongoose-paginate-v2 type issue
                return this.Model.paginate(query, paginationOptions);
            }), 'Pagination failed');
        });
    }
    /**
     * Performs bulk write operations with optional transaction support
     * @param {any[]} operations Array of bulk write operations
     * @param {ClientSession} [session] Optional database session
     * @returns {Promise<any>} Result of bulk write operations
     */
    bulkWrite(operations, session) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeWithErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
                return this.Model.bulkWrite(operations, { session });
            }), 'Bulk write operation failed');
        });
    }
    /**
     * Deletes a document by its ID
     * @param {string} id The document ID to delete
     * @param {Object} [options={}] Additional delete options
     * @param {ClientSession} [options.session] Database session
     * @returns {Promise<any>} Result of the delete operation
     */
    deleteById(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, options = {}) {
            return this.executeWithErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
                const { session = null } = options;
                return this.Model.findByIdAndDelete(id).session(session);
            }), 'Delete by ID operation failed');
        });
    }
    /**
     * Deletes a single document matching the query
     * @param {FilterQuery<T>} query The query to find the document
     * @param {Object} [options={}] Additional delete options
     * @param {ClientSession} [options.session] Database session
     * @returns {Promise<any>} Result of the delete operation
     */
    deleteOne(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, options = {}) {
            return this.executeWithErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
                const { session = null } = options;
                return this.Model.findOneAndDelete(query).session(session);
            }), 'Delete one operation failed');
        });
    }
    /**
     * Deletes multiple documents matching the query
     * @param {FilterQuery<T>} query The query to find documents
     * @param {Object} [options={}] Additional delete options
     * @param {ClientSession} [options.session] Database session
     * @returns {Promise<any>} Result of the delete operation
     */
    deleteMany(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, options = {}) {
            return this.executeWithErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
                const { session = null } = options;
                return this.Model.deleteMany(query).session(session);
            }), 'Delete many operation failed');
        });
    }
    /**
     * Performs aggregation operations with error handling
     * @param {PipelineStage[]} pipeline Array of aggregation pipeline stages
     * @param {Object} [options={}] Additional aggregation options
     * @param {ClientSession} [options.session] Database session for transactions
     * @returns {Promise<any[]>} Result of the aggregation pipeline
     */
    aggregate(pipeline_1) {
        return __awaiter(this, arguments, void 0, function* (pipeline, options = {}) {
            return this.executeWithErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
                const { session = null } = options;
                let aggregation = this.Model.aggregate(pipeline);
                // Add session if provided
                if (session) {
                    aggregation = aggregation.session(session);
                }
                return aggregation.exec();
            }), 'Aggregation operation failed');
        });
    }
}
exports.default = DBService;
