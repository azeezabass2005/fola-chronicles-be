import argon2 from 'argon2';
import logger from './logger.utils';

export interface IHash {
    password: string;
}

export class HashService {

    /**
     * Generate a secure password hash
     * @param password Plain text password
     * @returns Hashed password
     */
    static async hashPassword(password: string): Promise<IHash> {
        try {
            // User argon2 for password hashing
            const hashedPassword = await argon2.hash(password);

            return {
                password: hashedPassword,
            };
        } catch (error) {
            logger.error('Password hashing failed', {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw new Error('Password hashing failed');
        }
    }

    /**
     * Verify password against stored hash
     * @param plainPassword Submitted password
     * @param hashedPassword Stored hashed password
     * @returns Boolean indicating password match
     */
    static async verifyPassword(
        plainPassword: string,
        hashedPassword: string
    ): Promise<boolean> {
        try {
            return await argon2.verify(hashedPassword, plainPassword);
        } catch (error) {
            logger.error('Password verification failed', {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
            });
            return false;
        }
    }
}

export default HashService;