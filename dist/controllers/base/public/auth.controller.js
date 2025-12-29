"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../base-controller"));
const hash_utils_1 = __importDefault(require("../../../utils/hash.utils"));
const token_utils_1 = __importDefault(require("../../../utils/token.utils"));
const error_response_message_1 = __importStar(require("../../../common/messages/error-response-message"));
const interface_1 = require("../../../utils/interface");
const constant_1 = require("../../../common/constant");
const refresh_service_1 = __importDefault(require("../../../services/refresh.service"));
const auth_middleware_1 = __importDefault(require("../../../middlewares/auth.middleware"));
const validators_1 = require("../../../validators");
const env_config_1 = __importDefault(require("../../../config/env.config"));
/**
 * Controller handling authentication-related operations
 * @class AuthController
 * @extends BaseController
 */
class AuthController extends base_controller_1.default {
    /**
     * Creates an instance of AuthController
     */
    constructor() {
        super();
        this.tokenBuilder = new token_utils_1.default();
        this.refreshTokenService = new refresh_service_1.default;
        this.setupRoutes();
    }
    /**
     * Sets up routes for authentication operations
     * @protected
     */
    setupRoutes() {
        // Registration route
        this.router.post("/register", validators_1.registerValidate, this.register.bind(this));
        // Login route
        this.router.post("/login", validators_1.loginValidate, this.login.bind(this));
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
        this.router.post("/logout-all", auth_middleware_1.default.validateAuthorization.bind(auth_middleware_1.default), this.logoutAll.bind(this));
    }
    /**
     * Registers a new user
     * @private
     */
    register(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, username, password } = req.body;
                if (!email || !username || !password) {
                    next(error_response_message_1.default.payloadIncorrect("Email, username and password are required"));
                    return;
                }
                // Check if user already exists
                const existingUser = yield this.userService.findOne({
                    $or: [{ email }, { username }]
                });
                if (existingUser) {
                    next(error_response_message_1.default.createError(error_response_message_1.ErrorResponseCode.RESOURCE_ALREADY_EXISTS, "Email or username already exists", error_response_message_1.ErrorSeverity.MEDIUM));
                }
                // Hash password
                const hashedPassword = yield hash_utils_1.default.hashPassword(password);
                // Create user
                const user = yield this.userService.save({
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
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Authenticates a user and returns access token
     * @private
     */
    login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    next(error_response_message_1.default.payloadIncorrect("Email and password are required"));
                    return;
                }
                // Find user
                const user = yield this.userService.findOne({ email });
                if (!user) {
                    next(error_response_message_1.default.unauthorized("Invalid credentials"));
                    return;
                }
                // Verify password
                const isValidPassword = yield hash_utils_1.default.verifyPassword(password, user.password);
                if (!isValidPassword) {
                    next(error_response_message_1.default.unauthorized("Invalid credentials"));
                    return;
                }
                // Generate tokens
                const accessToken = this.tokenBuilder.build().createToken(user, {
                    type: interface_1.TokenType.ACCESS,
                    expiresIn: '1h'
                });
                const refreshToken = this.tokenBuilder.build().createToken(user, {
                    type: interface_1.TokenType.REFRESH,
                    expiresIn: '7d'
                });
                console.log(accessToken, "This is the access token");
                console.log(refreshToken, "This is the refresh token");
                // Save refresh token to database
                const decodedRefresh = yield this.tokenBuilder
                    .setToken(refreshToken)
                    .build()
                    .verifyToken();
                console.log(decodedRefresh, "This is the decoded refresh token");
                if (decodedRefresh) {
                    yield this.refreshTokenService.saveRefreshToken(user._id, refreshToken, req.headers['user-agent'], req.ip);
                }
                res.cookie('accessToken', accessToken, {
                    httpOnly: true, // Secure, not accessible via JS
                    secure: env_config_1.default.NODE_ENV === 'production',
                    // secure: true,
                    sameSite: 'lax',
                    path: "/",
                    maxAge: 60 * 60 * 1000, // 1 hour
                    domain: env_config_1.default.COOKIE_DOMAIN,
                });
                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: env_config_1.default.NODE_ENV === 'production',
                    // secure: true,
                    sameSite: 'lax',
                    path: "/",
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    domain: env_config_1.default.COOKIE_DOMAIN,
                });
                res.cookie('role', (_a = Object.entries(constant_1.ROLE_MAP).find(([_, v]) => v === user.role)) === null || _a === void 0 ? void 0 : _a[0], {
                    httpOnly: false, // Allow client-side access (if needed)
                    secure: env_config_1.default.NODE_ENV === 'production',
                    // secure: true,
                    sameSite: 'lax',
                    path: "/",
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    domain: env_config_1.default.COOKIE_DOMAIN,
                });
                this.sendSuccess(res, {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user._id,
                        email: user.email,
                        username: user.username,
                        role: (_b = Object.entries(constant_1.ROLE_MAP).find(([_, v]) => v === user.role)) === null || _b === void 0 ? void 0 : _b[0]
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Verifies user's email address
     * @private
     */
    verifyEmail(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { token } = req.body;
                if (!token) {
                    next(error_response_message_1.default.payloadIncorrect("Verification token is required"));
                    return;
                }
                // Verify token
                const decoded = yield this.tokenBuilder
                    .setToken(token)
                    .build()
                    .verifyToken();
                if (decoded.type !== interface_1.TokenType.VERIFY) {
                    next(error_response_message_1.default.unauthorized("Invalid verification token"));
                    return;
                }
                // Update user verification status
                const user = yield this.userService.update(decoded.data.userId, {
                    isVerified: true
                });
                if (!user) {
                    next(error_response_message_1.default.resourceNotFound("User"));
                    return;
                }
                this.sendSuccess(res, {
                    message: "Email verified successfully"
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Initiates password reset process
     * @private
     */
    forgotPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (!email) {
                    next(error_response_message_1.default.payloadIncorrect("Email is required"));
                    return;
                }
                const user = yield this.userService.findOne({ email });
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
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Resets user's password
     * @private
     */
    resetPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { token, newPassword } = req.body;
                if (!token || !newPassword) {
                    next(error_response_message_1.default.payloadIncorrect("Token and new password are required"));
                    return;
                }
                // Verify token
                const decoded = yield this.tokenBuilder
                    .setToken(token)
                    .build()
                    .verifyToken();
                if (decoded.type !== interface_1.TokenType.RESET) {
                    next(error_response_message_1.default.unauthorized("Invalid reset token"));
                    return;
                }
                // Hash new password
                const hashedPassword = yield hash_utils_1.default.hashPassword(newPassword);
                // Update password
                const user = yield this.userService.update(decoded.data.userId, {
                    password: hashedPassword.password
                });
                if (!user) {
                    next(error_response_message_1.default.resourceNotFound("User"));
                    return;
                }
                this.sendSuccess(res, {
                    message: "Password reset successful"
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Refreshes access token using refresh token
     * @private
     */
    refreshToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    next(error_response_message_1.default.payloadIncorrect("Refresh token is required"));
                    return;
                }
                // Verify refresh token
                const decoded = yield this.tokenBuilder
                    .setToken(refreshToken)
                    .build()
                    .verifyToken();
                if (decoded.type !== interface_1.TokenType.REFRESH) {
                    next(error_response_message_1.default.unauthorized("Invalid refresh token"));
                    return;
                }
                const refreshPayload = decoded.data;
                // Verify token exists in database and is valid
                const tokenDoc = yield this.refreshTokenService.findValidToken(refreshPayload.tokenId);
                if (!tokenDoc) {
                    next(error_response_message_1.default.unauthorized("Invalid refresh token"));
                    return;
                }
                // Find user
                const user = yield this.userService.findById(refreshPayload.userId);
                if (!user) {
                    next(error_response_message_1.default.resourceNotFound("User"));
                    return;
                }
                // Revoke current refresh token
                yield this.refreshTokenService.revokeToken(refreshPayload.tokenId);
                // Generate new tokens
                const tokenInstance = this.tokenBuilder.build();
                const newAccessToken = tokenInstance.createToken(user, {
                    type: interface_1.TokenType.ACCESS,
                    expiresIn: '15m'
                });
                const newRefreshToken = this.tokenBuilder.build().createToken(user, {
                    type: interface_1.TokenType.REFRESH,
                    expiresIn: '7d'
                });
                // Save new refresh token
                const newDecodedRefresh = yield this.tokenBuilder
                    .setToken(newRefreshToken)
                    .build()
                    .verifyToken();
                yield this.refreshTokenService.saveRefreshToken(user._id, newDecodedRefresh.data.tokenId, req.headers['user-agent'], req.ip);
                this.sendSuccess(res, {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Logs out the user from all sessions by revoking all their refresh tokens.
     * @private
     */
    logoutAll(_req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get the user ID from the request (added by auth middleware)
                const user = res.locals.user;
                if (!user._id) {
                    next(error_response_message_1.default.unauthorized("User not authenticated"));
                    return;
                }
                // Revoke all refresh tokens for the user
                yield this.refreshTokenService.revokeAllUserTokens(user._id);
                this.sendSuccess(res, {
                    message: "Logged out from all sessions successfully"
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    ;
}
exports.default = new AuthController().router;
