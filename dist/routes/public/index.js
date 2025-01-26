"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import proposalRouter from "../../controllers/public/proposal.controller"
const path = "/public";
const publicRouter = (0, express_1.Router)();
// publicRouter.use(path)
// You can add all other paths here
// e.g publicRouter.use(`${path}/proposal`, proposalRouter)
exports.default = publicRouter;
