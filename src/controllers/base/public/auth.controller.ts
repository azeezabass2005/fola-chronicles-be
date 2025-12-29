import { Request, Response, NextFunction } from "express";
import BaseController from "../base-controller";
import HashService from "../../../utils/hash.utils";
import TokenBuilder from "../../../utils/token.utils";
import errorResponseMessage, { ErrorResponseCode, ErrorSeverity } from "../../../common/messages/error-response-message";
import {IRefreshTokenPayload, TokenType} from "../../../utils/interface";
import {ROLE_MAP} from "../../../common/constant";
import RefreshTokenService from "../../../services/refresh.service";
import authMiddleware from "../../../middlewares/auth.middleware";
import {loginValidate, registerValidate} from "../../../validators";
import config from "../../../config/env.config";

/**
 * Controller handling authentication-related operations
 * @class AuthController
 * @extends BaseController
 */
class AuthController extends BaseController {
    private tokenBuilder: TokenBuilder;
    private refreshTokenService: RefreshTokenService;

    /**
     * Creates an instance of AuthController
     */
    constructor() {
        super();
        this.tokenBuilder = new TokenBuilder();
        this.refreshTokenService = new RefreshTokenService;
        this.setupRoutes();
    }

    /**
     * Sets up routes for authentication operations
     * @protected
     */
    protected setupRoutes(): void {
        // Registration route
        this.router.post("/register", registerValidate, this.register.bind(this));

        // Login route
        this.router.post("/login", loginValidate, this.login.bind(this));

        // Verify email route
        this.router.post("/verify-email", this.verifyEmail.bind(this));

        // Request password reset route
        this.router.post("/forgot-password", this.forgotPassword.bind(this));

        // Reset password route
        this.router.post("/reset-password", this.resetPassword.bind(this));

        // Refresh token route
        this.router.post("/refresh-token", this.refreshToken.bind(this));

        // Logout route
        // You can choose to migrate this to the protected route section for the auth.
        this.router.post("/logout-all",
            authMiddleware.validateAuthorization.bind(authMiddleware),
            this.logoutAll.bind(this)
        );
    }

    /**
     * Registers a new user
     * @private
     */
    private async register (req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, username, password } = req.body;

            if (!email || !username || !password) {
                next(errorResponseMessage.payloadIncorrect("Email, username and password are required"));
                return;
            }

            // Check if user already exists
            const existingUser = await this.userService.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                next(errorResponseMessage.createError(
                    ErrorResponseCode.RESOURCE_ALREADY_EXISTS,
                    "Email or username already exists",
                    ErrorSeverity.MEDIUM
                ));
            }

            // Hash password
            const hashedPassword = await HashService.hashPassword(password);

            // Create user
            const user = await this.userService.save({
                email,
                username,
                password: hashedPassword.password,
                isVerified: false
            });

            // Generate verification token
            // const verificationToken = this.tokenBuilder.build().createVerifyToken({
            //     userId: user._id as string,
            //     email: user.email,
            //     username: user.username
            // });

            // TODO: Send verification email
            // await emailService.sendVerificationEmail(email, verificationToken);

            this.sendSuccess(res, {
                message: "Registration successful. Please verify your email.",
                userId: user._id
            }, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Authenticates a user and returns access token
     * @private
     */
    private async login (req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                next(errorResponseMessage.payloadIncorrect("Email and password are required"));
                return;
            }

            // Find user
            const user = await this.userService.findOne({ email });
            if (!user) {
                next(errorResponseMessage.unauthorized("Invalid credentials"));
                return;
            }

            // Verify password
            const isValidPassword = await HashService.verifyPassword(
                password,
                user.password
            );

            if (!isValidPassword) {
                next(errorResponseMessage.unauthorized("Invalid credentials"));
                return;
            }


            // Generate tokens
            const accessToken = this.tokenBuilder.build().createToken(user, {
                type: TokenType.ACCESS,
                expiresIn: '1h'
            });

            const refreshToken = this.tokenBuilder.build().createToken(user, {
                type: TokenType.REFRESH,
                expiresIn: '7d'
            });

            console.log(accessToken, "This is the access token");
            console.log(refreshToken, "This is the refresh token")

            // Save refresh token to database
            const decodedRefresh = await this.tokenBuilder
                .setToken(refreshToken)
                .build()
                .verifyToken();

            console.log(decodedRefresh, "This is the decoded refresh token");

            if(decodedRefresh) {
                await this.refreshTokenService.saveRefreshToken(
                    user._id as string,
                    refreshToken,
                    req.headers['user-agent'],
                    req.ip
                );
            }

             res.cookie('accessToken', accessToken, {
                httpOnly: true,  // Secure, not accessible via JS
                secure: config.NODE_ENV === 'production',
                // secure: true,
                sameSite: 'lax',
                path: "/",
                maxAge: 60 * 60 * 1000,  // 1 hour
                domain: config.COOKIE_DOMAIN,
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: config.NODE_ENV === 'production',
                // secure: true,
                sameSite: 'lax',
                path: "/",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                domain: config.COOKIE_DOMAIN,
            });

            res.cookie('role', Object.entries(ROLE_MAP).find(([_, v]) => v === user.role)?.[0], {
                httpOnly: false, // Allow client-side access (if needed)
                secure: config.NODE_ENV === 'production',
                // secure: true,
                sameSite: 'lax',
                path: "/",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                domain: config.COOKIE_DOMAIN,
            });

            this.sendSuccess(res, {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: Object.entries(ROLE_MAP).find(([_, v]) => v === user.role)?.[0]
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verifies user's email address
     * @private
     */
    private async verifyEmail (req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token } = req.body;

            if (!token) {
                next(errorResponseMessage.payloadIncorrect("Verification token is required"));
                return;
            }

            // Verify token
            const decoded = await this.tokenBuilder
                .setToken(token)
                .build()
                .verifyToken();

            if (decoded.type !== TokenType.VERIFY) {
                next(errorResponseMessage.unauthorized("Invalid verification token"));
                return;
            }

            // Update user verification status
            const user = await this.userService.update(decoded.data.userId, {
                isVerified: true
            });

            if (!user) {
                next(errorResponseMessage.resourceNotFound("User"));
                return;
            }

            this.sendSuccess(res, {
                message: "Email verified successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Initiates password reset process
     * @private
     */
    private async forgotPassword (req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;

            if (!email) {
                next(errorResponseMessage.payloadIncorrect("Email is required"));
                return;
            }

            const user = await this.userService.findOne({ email });

            // Always return success even if user doesn't exist (security best practice)
            this.sendSuccess(res, {
                message: "If your email exists, you will receive a password reset link"
            });

            if (user) {
                // Generate reset token
                // const resetToken = this.tokenBuilder.build().createToken(user, {
                //     type: TokenType.RESET,
                //     expiresIn: '1h'
                // });

                // TODO: Send password reset email
                // await emailService.sendPasswordResetEmail(email, resetToken);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Resets user's password
     * @private
     */
    private async resetPassword (req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                next(errorResponseMessage.payloadIncorrect("Token and new password are required"));
                return;
            }

            // Verify token
            const decoded = await this.tokenBuilder
                .setToken(token)
                .build()
                .verifyToken();

            if (decoded.type !== TokenType.RESET) {
                next(errorResponseMessage.unauthorized("Invalid reset token"));
                return;
            }

            // Hash new password
            const hashedPassword = await HashService.hashPassword(newPassword);

            // Update password
            const user = await this.userService.update(decoded.data.userId, {
                password: hashedPassword.password
            });

            if (!user) {
                next(errorResponseMessage.resourceNotFound("User"));
                return;
            }

            this.sendSuccess(res, {
                message: "Password reset successful"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refreshes access token using refresh token
     * @private
     */
    private async refreshToken (req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                next(errorResponseMessage.payloadIncorrect("Refresh token is required"));
                return;
            }

            // Verify refresh token
            const decoded = await this.tokenBuilder
                .setToken(refreshToken)
                .build()
                .verifyToken();

            if (decoded.type !== TokenType.REFRESH) {
                next(errorResponseMessage.unauthorized("Invalid refresh token"));
                return;
            }

            const refreshPayload = decoded.data as IRefreshTokenPayload;

            // Verify token exists in database and is valid
            const tokenDoc = await this.refreshTokenService.findValidToken(refreshPayload.tokenId);
            if (!tokenDoc) {
                next(errorResponseMessage.unauthorized("Invalid refresh token"));
                return;
            }

            // Find user
            const user = await this.userService.findById(refreshPayload.userId);
            if (!user) {
                next(errorResponseMessage.resourceNotFound("User"));
                return;
            }

            // Revoke current refresh token
            await this.refreshTokenService.revokeToken(refreshPayload.tokenId);

            // Generate new tokens
            const tokenInstance = this.tokenBuilder.build();

            const newAccessToken = tokenInstance.createToken(user, {
                type: TokenType.ACCESS,
                expiresIn: '15m'
            });

            const newRefreshToken = this.tokenBuilder.build().createToken(user, {
                type: TokenType.REFRESH,
                expiresIn: '7d'
            });

            // Save new refresh token
            const newDecodedRefresh = await this.tokenBuilder
                .setToken(newRefreshToken)
                .build()
                .verifyToken();


            await this.refreshTokenService.saveRefreshToken(
                user._id as string,
                (newDecodedRefresh.data as IRefreshTokenPayload).tokenId,
                req.headers['user-agent'],
                req.ip
            );

            this.sendSuccess(res, {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logs out the user from all sessions by revoking all their refresh tokens.
     * @private
     */
    private async logoutAll (_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Get the user ID from the request (added by auth middleware)
            const user = res.locals.user;

            if (!user._id) {
                next(errorResponseMessage.unauthorized("User not authenticated"));
                return;
            }

            // Revoke all refresh tokens for the user
            await this.refreshTokenService.revokeAllUserTokens(user._id);

            this.sendSuccess(res, {
                message: "Logged out from all sessions successfully"
            });
        } catch (error) {
            next(error);
        }
    };

}

export default new AuthController().router;