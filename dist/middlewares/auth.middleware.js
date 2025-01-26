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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const token_utils_1 = __importDefault(require("../utils/token.utils"));
const user_service_1 = __importDefault(require("../services/user.service"));
class AuthMiddleware {
    /**
     * Validates the presence of authorization header
     * @param req Express request object
     * @param res Express response object
     * @param next Next middleware function
     */
    validateAuthorization(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { authorization } = req.headers;
                if (!authorization) {
                    return res.status(401).json({ error: "Unauthorized: Missing token" });
                }
                // Validate and parse token
                const token = this.parseToken(authorization);
                const { data, iat, exp } = yield token.verifyToken();
                // Validate token contents
                if (!(data === null || data === void 0 ? void 0 : data.email) || !(data === null || data === void 0 ? void 0 : data.userId) || !(data === null || data === void 0 ? void 0 : data.username)) {
                    return res.status(401).json({ error: "Unauthorized: Invalid token" });
                }
                // Attach user info to response locals
                res.locals.userId = data.userId;
                res.locals.email = data.email;
                res.locals.username = data.username;
                // Verify user exists
                yield this.verifyUser(res);
                return next();
            }
            catch (error) {
                console.error("Authorization error:", error);
                return res.status(401).json({ error: "Unauthorized" });
            }
        });
    }
    /**
     * Parses the authorization token
     * @param authorization Authorization header string
     * @returns Parsed token
     */
    parseToken(authorization) {
        const splitToken = authorization.split(" ");
        if (splitToken.length > 2) {
            throw new Error("Invalid token format");
        }
        const _token = splitToken.length === 2 ? splitToken[1] : splitToken[0];
        return new token_utils_1.default().setToken(_token).build();
    }
    /**
     * Verifies the user exists in the database
     * @param res Express response object
     */
    verifyUser(res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userService = new user_service_1.default();
            const getUser = yield userService.findOne({
                _id: res.locals.userId,
                email: res.locals.email,
                username: res.locals.username,
            });
            if (!(getUser === null || getUser === void 0 ? void 0 : getUser._id)) {
                throw new Error("User not found");
            }
            // Remove sensitive information
            const _a = getUser === null || getUser === void 0 ? void 0 : getUser.toJSON(), { password } = _a, user = __rest(_a, ["password"]);
            res.locals.user = user;
        });
    }
}
exports.default = new AuthMiddleware();
