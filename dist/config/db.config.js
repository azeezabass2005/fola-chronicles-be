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
const mongoose_1 = __importDefault(require("mongoose"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const env_config_1 = __importDefault(require("./env.config"));
class DatabaseService {
    constructor() {
        this.setupConnectionHandlers();
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    setupConnectionHandlers() {
        mongoose_1.default.connection.on('error', (error) => {
            logger_utils_1.default.error('MongoDB connection error', {
                error: error instanceof Error ? error.message : error
            });
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_utils_1.default.warn('MongoDB disconnected');
        });
        process.on('SIGINT', () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield mongoose_1.default.connection.close();
                logger_utils_1.default.info('MongoDB connection closed through app termination');
                process.exit(0);
            }
            catch (error) {
                logger_utils_1.default.error('Error during MongoDB connection closure', {
                    error: error instanceof Error ? error.message : error
                });
                process.exit(1);
            }
        }));
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield mongoose_1.default.connect(env_config_1.default.MONGODB_URI);
                logger_utils_1.default.info('Connected to MongoDB successfully', {
                    uri: env_config_1.default.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') // Hide credentials in logs
                });
            }
            catch (error) {
                logger_utils_1.default.error('MongoDB connection error', {
                    error: error instanceof Error ? error.message : error
                });
                process.exit(1);
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield mongoose_1.default.connection.close();
        });
    }
    isConnected() {
        return mongoose_1.default.connection.readyState === 1;
    }
}
exports.default = DatabaseService;
