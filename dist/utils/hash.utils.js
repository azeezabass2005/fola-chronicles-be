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
exports.HashService = void 0;
const argon2_1 = __importDefault(require("argon2"));
class HashService {
    /**
     * Generate a secure password hash
     * @param password Plain text password
     * @returns Hashed password
     */
    static hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // User argon2 for password hashing
                const hashedPassword = yield argon2_1.default.hash(password);
                return {
                    password: hashedPassword,
                };
            }
            catch (error) {
                console.error('Password hashing failed', error);
                throw new Error('Password hashing failed');
            }
        });
    }
    /**
     * Verify password against stored hash
     * @param plainPassword Submitted password
     * @param hashedPassword Stored hashed password
     * @returns Boolean indicating password match
     */
    static verifyPassword(plainPassword, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield argon2_1.default.verify(hashedPassword, plainPassword);
            }
            catch (error) {
                console.error('Password verification failed', error);
                return false;
            }
        });
    }
}
exports.HashService = HashService;
exports.default = HashService;
