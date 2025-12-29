"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTagCreate = exports.validatePostCreate = exports.registerValidate = exports.loginValidate = void 0;
const z_login_1 = __importDefault(require("./z-login"));
exports.loginValidate = z_login_1.default;
const z_register_1 = __importDefault(require("./z-register"));
exports.registerValidate = z_register_1.default;
const z_post_create_1 = __importDefault(require("./z-post-create"));
exports.validatePostCreate = z_post_create_1.default;
const z_tag_create_1 = __importDefault(require("./z-tag-create"));
exports.validateTagCreate = z_tag_create_1.default;
