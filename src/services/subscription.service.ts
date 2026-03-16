import DBService from '../utils/db.utils';
import { ISubscription } from '../models/interface';
import Subscription from '../models/subscription.model';
import crypto from 'crypto';

/**
 * Service class for Subscription-related database operations
 *
 * @description Extends the generic DBService with Subscription-specific configurations
 * @extends {DBService<ISubscription>}
 */
class SubscriptionService extends DBService<ISubscription> {
    /**
     * Creates an instance of SubscriptionService
     *
     * @constructor
     */
    constructor() {
        super(Subscription);
    }

    /**
     * Creates a new subscription with confirmation token
     * @param {string} email Email address to subscribe
     * @returns {Promise<ISubscription>} Created subscription
     */
    async createSubscription(email: string): Promise<ISubscription> {
        // Check if subscription already exists
        const existing = await this.findOne({ email: email.toLowerCase() });
        
        if (existing) {
            // If already confirmed and active, return existing
            if (existing.isConfirmed && existing.isActive) {
                return existing;
            }
            // If exists but not confirmed, update with new token
            const confirmationToken = this.generateConfirmationToken();
            return await this.updateById(existing._id as string, {
                confirmationToken,
                isActive: true,
                subscribedAt: new Date(),
                unsubscribedAt: undefined,
            });
        }

        // Create new subscription
        const confirmationToken = this.generateConfirmationToken();
        return await this.save({
            email: email.toLowerCase(),
            isActive: true,
            isConfirmed: false,
            confirmationToken,
            subscribedAt: new Date(),
        });
    }

    /**
     * Confirms a subscription using the confirmation token
     * @param {string} token Confirmation token
     * @returns {Promise<ISubscription | null>} Confirmed subscription or null if not found
     */
    async confirmSubscription(token: string): Promise<ISubscription | null> {
        const subscription = await this.findOne({ confirmationToken: token });
        
        if (!subscription) {
            return null;
        }

        return await this.updateById(subscription._id as string, {
            isConfirmed: true,
            confirmedAt: new Date(),
            confirmationToken: undefined,
        });
    }

    /**
     * Unsubscribes an email address
     * @param {string} email Email address to unsubscribe
     * @returns {Promise<ISubscription | null>} Unsubscribed subscription or null if not found
     */
    async unsubscribe(email: string): Promise<ISubscription | null> {
        const subscription = await this.findOne({ email: email.toLowerCase() });
        
        if (!subscription) {
            return null;
        }

        return await this.updateById(subscription._id as string, {
            isActive: false,
            unsubscribedAt: new Date(),
        });
    }

    /**
     * Gets all active and confirmed subscriptions
     * @returns {Promise<ISubscription[]>} Array of active subscriptions
     */
    async getActiveSubscriptions(): Promise<ISubscription[]> {
        return await this.findMany({
            isActive: true,
            isConfirmed: true,
        });
    }

    /**
     * Generates a secure confirmation token
     * @returns {string} Confirmation token
     */
    private generateConfirmationToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}

export default SubscriptionService;
