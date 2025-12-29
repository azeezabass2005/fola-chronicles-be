import BaseController from "../base-controller";
import {Request, Response, NextFunction} from "express";
import errorResponseMessage from "../../../common/messages/error-response-message";
import {ROLE_MAP} from "../../../common/constant";

/**
 * Controller handling authentication-related operations
 * @class UserController
 * @extends BaseController
 */
class UserController extends BaseController {

    /**
     * Creates an instance of UserController
     */
    constructor() {
        super();
        this.setupRoutes();
    }

    /**
     * Sets up routes for authentication operations
     * @protected
     */
    protected setupRoutes(): void {
        // Get Current User route
        this.router.get("/current", this.getCurrentUser.bind(this));
    }

    /**
     * Helper method to convert role number to role string
     * @private
     */
    private getRoleString(roleNumber: number): string {
        return Object.entries(ROLE_MAP).find(([_, v]) => v === roleNumber)?.[0] || 'Unknown';
    }

    /**
     * Retrieve the current user information.
     * @private
     */
    private async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = res.locals.user;

            if (!user) {
                return next(errorResponseMessage.unauthorized());
            }

            const { _id, __v, password, ...otherUserData } = user;

            const sanitizedUser = {
                ...otherUserData,
                role: this.getRoleString(user.role),
            }
            
            return this.sendSuccess(res, {
                message: "User information retrieved successfully",
                user: sanitizedUser,
            })
        } catch (error) {
            return next(error)
        }
    }

}

export default new UserController().router;