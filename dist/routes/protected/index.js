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
// In your protected routes file
const express_1 = require("express");
const auth_middleware_1 = __importDefault(require("../../middlewares/auth.middleware"));
const post_controller_1 = __importDefault(require("../../controllers/base/protected/post.controller"));
const user_controller_1 = __importDefault(require("../../controllers/base/protected/user.controller"));
const path = "/protected";
const protectedRouter = (0, express_1.Router)();
protectedRouter.use(path, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield auth_middleware_1.default.validateAuthorization(req, res, next);
        // next()
    }
    catch (error) {
        next(error);
    }
}));
protectedRouter.use(`${path}/posts`, post_controller_1.default);
protectedRouter.use(`${path}/users`, user_controller_1.default);
exports.default = protectedRouter;
