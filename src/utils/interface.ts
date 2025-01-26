/**
 * Interface for token payload data
 */
export interface ITokenPayload {
    userId: string;
    email: string;
    username: string;
}

/**
 * Interface for verify token payload
 */
export interface IVerifyTokenPayload extends ITokenPayload {
    date: Date;
}

/**
 * Represents different token types
 */
export enum TokenType {
    ACCESS = 'access',
    VERIFY = 'verify',
    REFRESH = 'refresh'
}

/**
 * Interface for token creation options
 */
export interface ITokenOptions {
    type?: TokenType;
    expiresIn?: string;
}