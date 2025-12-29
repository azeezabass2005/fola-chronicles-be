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
const logger_utils_1 = __importDefault(require("./utils/logger.utils"));
const app_1 = __importDefault(require("./app"));
process.on('exit', (code) => {
    logger_utils_1.default.info(`Process exiting with code: ${code}`);
});
process.on('SIGINT', () => {
    logger_utils_1.default.info('Server interrupted (SIGINT)');
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger_utils_1.default.info('Server terminated (SIGTERM)');
    process.exit(0);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const server = new app_1.default();
        server.start();
    }
    catch (error) {
        logger_utils_1.default.error('Failed to start server', {
            error: error instanceof Error ? error.message : error
        });
        process.exit(1);
    }
});
startServer();
