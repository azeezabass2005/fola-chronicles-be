// In your protected routes file
import { Router, Request, Response, NextFunction } from "express";
import authMiddleware from "../../middlewares/auth.middleware";

const path = "/protected";
const protectedRouter = Router();

protectedRouter.use(path, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authMiddleware.validateAuthorization(req, res, next);
    } catch (error) {
        next(error);
    }
});

export default protectedRouter;