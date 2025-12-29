// In your protected routes file
import { Router, Request, Response, NextFunction } from "express";
import authMiddleware from "../../middlewares/auth.middleware";
import postController from "../../controllers/base/protected/post.controller";
import userController from "../../controllers/base/protected/user.controller";

const path = "/protected";
const protectedRouter = Router();

protectedRouter.use(path, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authMiddleware.validateAuthorization(req, res, next);
        // next()
    } catch (error) {
        next(error);
    }
});

protectedRouter.use(`${path}/posts`, postController);
protectedRouter.use(`${path}/users`, userController);

export default protectedRouter;