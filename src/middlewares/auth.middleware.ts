import { Request, Response, NextFunction } from "express";
import TokenBuilder from "../utils/token.utils";
import UserService from "../services/user.service";

class AuthMiddleware {
    /**
     * Validates the presence of authorization header
     * @param req Express request object
     * @param res Express response object
     * @param next Next middleware function
     */
    async validateAuthorization(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { authorization } = req.headers;

            if (!authorization) {
                return res.status(401).json({ error: "Unauthorized: Missing token" });
            }

            // Validate and parse token
            const token = this.parseToken(authorization);
            const { data, iat, exp }: any = await token.verifyToken();

            // Validate token contents
            if (!data?.email || !data?.userId || !data?.username) {
                return res.status(401).json({ error: "Unauthorized: Invalid token" });
            }

            // Attach user info to response locals
            res.locals.userId = data.userId;
            res.locals.email = data.email;
            res.locals.username = data.username;

            // Verify user exists
            await this.verifyUser(res);

            return next();
        } catch (error) {
            console.error("Authorization error:", error);
            return res.status(401).json({ error: "Unauthorized" });
        }
    }

    /**
     * Parses the authorization token
     * @param authorization Authorization header string
     * @returns Parsed token
     */
    private parseToken(authorization: string) {
        const splitToken = authorization.split(" ");

        if (splitToken.length > 2) {
            throw new Error("Invalid token format");
        }

        const _token = splitToken.length === 2 ? splitToken[1] : splitToken[0];
        return new TokenBuilder().setToken(_token).build();
    }

    /**
     * Verifies the user exists in the database
     * @param res Express response object
     */
    private async verifyUser(res: Response) {
        const userService = new UserService();
        const getUser = await userService.findOne({
            _id: res.locals.userId,
            email: res.locals.email,
            username: res.locals.username,
        });

        if (!getUser?._id) {
            throw new Error("User not found");
        }

        // Remove sensitive information
        const { password, ...user } = getUser?.toJSON();
        res.locals.user = user;
    }
}

export default new AuthMiddleware();