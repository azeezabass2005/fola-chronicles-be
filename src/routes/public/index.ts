import {Router} from "express";
import authController from "../../controllers/base/public/auth.controller";
import postController from "../../controllers/base/public/post.controller"
import tagController from "../../controllers/base/public/tag.controller";
import categoryController from "../../controllers/base/public/category.controller";

const path = "/public";

const publicRouter = Router()

publicRouter.use(`${path}/auth`, authController)

publicRouter.use(`${path}/posts`, postController)

publicRouter.use(`${path}/tags`, tagController)

publicRouter.use(`${path}/categories`, categoryController)

export default publicRouter