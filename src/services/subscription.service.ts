import DBService from '../utils/db.utils';
import { ISubscription } from '../models/interface';
import Subscription from '../models/subscription.model';
import crypto from 'crypto';

/**
 * Outcome of a subscribe attempt, so callers can respond appropriately:
 * - 'created': brand-new subscription, confirmation email should be sent
 * - 'resent': existing but unconfirmed, a fresh confirmation email should be sent
 * - 'already_confirmed': already an active, confirmed subscriber; no email needed
 */
export type SubscriptionStatus = 'created' | 'resent' | 'already_confirmed';

/**
 * Result of createSubscription, pairing the record with what happened to it
 */
export interface SubscriptionResult {
    subscription: ISubscription;
    status: SubscriptionStatus;
}

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
     * Creates a subscription, or gracefully handles an email that already exists.
     * @param {string} email Email address to subscribe
     * @returns {Promise<SubscriptionResult>} The subscription and what happened to it
     */
    async createSubscription(email: string): Promise<SubscriptionResult> {
        const normalizedEmail = email.toLowerCase();
        const existing = await this.findOne({ email: normalizedEmail });

        if (existing) {
            // Already confirmed: reactivate if they'd previously unsubscribed,
            // but never re-issue a confirmation — they're already verified.
            if (existing.isConfirmed) {
                if (!existing.isActive) {
                    const reactivated = await this.updateById(existing._id as string, {
                        isActive: true,
                        subscribedAt: new Date(),
                        unsubscribedAt: undefined,
                    });
                    return { subscription: reactivated!, status: 'already_confirmed' };
                }
                return { subscription: existing, status: 'already_confirmed' };
            }

            // Exists but never confirmed: issue a fresh token and resend confirmation.
            const confirmationToken = this.generateConfirmationToken();
            const updated = await this.updateById(existing._id as string, {
                confirmationToken,
                isActive: true,
                subscribedAt: new Date(),
                unsubscribedAt: undefined,
            });
            return { subscription: updated!, status: 'resent' };
        }

        // Brand-new subscription
        const confirmationToken = this.generateConfirmationToken();
        const created = await this.save({
            email: normalizedEmail,
            isActive: true,
            isConfirmed: false,
            confirmationToken,
            subscribedAt: new Date(),
        });
        return { subscription: created, status: 'created' };
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
        return await this.find({
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
