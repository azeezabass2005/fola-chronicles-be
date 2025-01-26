"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const protected_1 = __importDefault(require("./protected"));
const public_1 = __importDefault(require("./public"));
const router = (0, express_1.Router)();
router.use(protected_1.default);
router.use(public_1.default);
exports.default = router;
