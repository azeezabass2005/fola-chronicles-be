import {NextFunction, Request, Response} from "express";
import {ROLE_MAP} from "../common/constant";
import errorResponseMessage, {ErrorResponse, ErrorSeverity} from "../common/messages/error-response-message";

type RoleType = keyof typeof ROLE_MAP;
type RoleNumber = typeof ROLE_MAP[RoleType];

class RoleMiddleware {
    /**
     * Checks if user has required role(s)
     * @param allowedRoles Single role or array of roles that are allowed
     */
    hasRole(allowedRoles: RoleNumber | RoleNumber[]) {
        return async (_req: Request, res: Response, next: NextFunction) => {
            try {
                // Get user from res.locals (set by auth middleware)
                const user = res.locals.user;

                if (!user) {
                    return next(errorResponseMessage.unauthorized());
                }

                // Convert single role to array for consistent handling
                const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

                // Check if user's role is in allowed roles
                if (!roles.includes(user.role)) {
                    return next(errorResponseMessage.createError(
                        403,
                        "You don't have permission to perform this action",
                        ErrorSeverity.HIGH
                    ));
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Checks if user is an admin
     */
    isAdmin() {
        return this.hasRole(ROLE_MAP.ADMIN);
    }

    /**
     * Checks if user is the owner of the resource or an admin
     * @param resourceUserId string of the user id or an error that occurred when getting it
     * @param req
     * @param res
     * @param next
    */
    async isOwnerOrAdmin(resourceUserId: string | ErrorResponse, req: Request, res: Response, next: NextFunction) {
        try {
            const user = res.locals.user;

            if (!user) {
                return next(errorResponseMessage.unauthorized());
            }

            // If user is admin, allow access
            if (user.role === ROLE_MAP.ADMIN) {
                return next();
            }

            // Check if resource user id ror
            if(typeof resourceUserId !== 'string') {
                return next(resourceUserId)
            }

            // Check if user is the owner
            if (user._id.toString() !== resourceUserId) {
                return next(errorResponseMessage.createError(
                    403,
                    "You don't have permission to perform this action",
                    ErrorSeverity.HIGH
                ));
            }

            next();
        } catch (error) {
            next(error);
        }
    }
}

export default new RoleMiddleware();