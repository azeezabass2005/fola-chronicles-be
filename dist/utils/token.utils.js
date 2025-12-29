"use strict";
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
exports.TokenUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const interface_1 = require("./interface");
dotenv_1.default.config();
/**
 * Utility functions for token-related operations
 */
class TokenUtils {
    /**
     * Adds specified number of days to the current date
     * @param days Number of days to add
     * @returns Future date
     */
    static addDaysToDate(days) {
        const date = new Date(Date.now());
        date.setDate(date.getDate() + days);
        return date;
    }
    /**
     * Generates a random token for additional security
     * @param length Length of the token (default: 32)
     * @returns Randomly generated token string
     */
    static generateRandomToken(length = 32) {
        return Array.from(crypto.getRandomValues(new Uint8Array(length)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    /**
     * Generates a random refresh token id for refresh token persistent storage
     * @returns Randomly generated token string
     */
    static generateRefreshTokenId() {
        return this.generateRandomToken(32);
    }
    static getRefreshTokenExpiry() {
        return this.addDaysToDate(7);
    }
}
exports.TokenUtils = TokenUtils;
/**
 * Represents a token management class with advanced features
 */
class Token {
    /**
     * Creates an instance of Token
     * @param token Optional existing token
     */
    constructor(token) {
        this.token = token || '';
    }
    /**
     * Creates an access token for user authentication
     * @param user User object to generate token for
     * @param options Token creation options
     * @returns Generated JWT token
     */
    createToken(user, options = {
        type: interface_1.TokenType.ACCESS,
        expiresIn: '168h'
    }) {
        const { type = interface_1.TokenType.ACCESS, expiresIn = '1h' } = options;
        const payload = {
            userId: user === null || user === void 0 ? void 0 : user._id,
            email: user === null || user === void 0 ? void 0 : user.email,
            role: user === null || user === void 0 ? void 0 : user.role,
            username: user === null || user === void 0 ? void 0 : user.username,
        };
        return jsonwebtoken_1.default.sign({
            data: payload,
            type
        }, this.getSecretKey(), {
            expiresIn,
            algorithm: 'HS256'
        });
    }
    /**
     * Creates a verification token
     * @param user User details for verification
     * @returns Verification JWT token
     */
    createVerifyToken(user) {
        const payload = Object.assign(Object.assign({}, user), { date: TokenUtils.addDaysToDate(3) });
        return jsonwebtoken_1.default.sign({
            data: payload,
            type: interface_1.TokenType.VERIFY
        }, this.getSecretKey(), {
            expiresIn: '72h',
            algorithm: 'HS256'
        });
    }
    /**
     * Verifies the JWT token
     * @param ignoreExpiration Whether to ignore token expiration
     * @returns Decoded token payload
     */
    verifyToken() {
        return __awaiter(this, arguments, void 0, function* (ignoreExpiration = false) {
            return new Promise((resolve, reject) => {
                jsonwebtoken_1.default.verify(this.token, this.getSecretKey(), {
                    ignoreExpiration,
                    algorithms: ['HS256']
                }, (err, decoded) => {
                    if (err) {
                        reject({
                            state: 2,
                            error: err,
                            message: 'Token verification failed'
                        });
                    }
                    else {
                        resolve(decoded);
                    }
                });
            });
        });
    }
    /**
     * Retrieves the secret key from environment variables
     * @returns JWT secret key
     * @throws {Error} If TOKEN_SECRET is not set
     */
    getSecretKey() {
        const secret = process.env["JWT_SECRET"];
        if (!secret) {
            throw new Error('TOKEN_SECRET is not defined in environment variables');
        }
        return secret;
    }
}
/**
 * Builder class for creating Token instances
 */
class TokenBuilder {
    /**
     * Sets the token for the builder
     * @param token Token string
     * @returns TokenBuilder instance
     */
    setToken(token) {
        this.token = token;
        return this;
    }
    /**
     * Builds and returns a Token instance
     * @returns Token instance
     */
    build() {
        return new Token(this.token);
    }
}
exports.default = TokenBuilder;
