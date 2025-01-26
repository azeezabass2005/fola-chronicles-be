"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const app_1 = __importDefault(require("./app"));
const logger_utils_1 = __importDefault(require("./utils/logger.utils"));
process.on('exit', (code) => {
    logger_utils_1.default.info(`Process exiting with code: ${code}`);
});
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
