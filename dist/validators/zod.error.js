"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = __importDefault(require("zod"));
const error_response_message_1 = __importDefault(require("../common/messages/error-response-message"));
const zodErrorHandler = (error, next) => {
    if (error instanceof zod_1.default.ZodError) {
        next(error_response_message_1.default.badRequest(error));
    }
    else if (error instanceof Error) {
        next(error_response_message_1.default.unableToComplete(error.message));
    }
    else {
        next(error_response_message_1.default.unableToComplete());
    }
};
exports.default = zodErrorHandler;
