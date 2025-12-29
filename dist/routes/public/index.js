"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../../controllers/base/public/auth.controller"));
const post_controller_1 = __importDefault(require("../../controllers/base/public/post.controller"));
const tag_controller_1 = __importDefault(require("../../controllers/base/public/tag.controller"));
const category_controller_1 = __importDefault(require("../../controllers/base/public/category.controller"));
const path = "/public";
const publicRouter = (0, express_1.Router)();
publicRouter.use(`${path}/auth`, auth_controller_1.default);
publicRouter.use(`${path}/posts`, post_controller_1.default);
publicRouter.use(`${path}/tags`, tag_controller_1.default);
publicRouter.use(`${path}/categories`, category_controller_1.default);
exports.default = publicRouter;
