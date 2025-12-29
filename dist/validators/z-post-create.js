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
const zod_1 = __importDefault(require("zod"));
const zod_error_1 = __importDefault(require("./zod.error"));
const ZPostCreate = zod_1.default.object({
    title: zod_1.default.string().min(3).max(100),
    content: zod_1.default.string().min(1000),
    tags: zod_1.default.array(zod_1.default.string()).max(8),
    category: zod_1.default.string().min(3).max(63),
});
const validate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ZPostCreate.parse(req.body);
        next();
    }
    catch (error) {
        (0, zod_error_1.default)(error, next);
    }
});
exports.default = validate;
