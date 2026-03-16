import SubscriptionService from '../services/subscription.service';
import EmailService from './email.utils';
import config from '../config/env.config';
import logger from './logger.utils';

/**
 * Utility functions for sending notifications to subscribers
 */
class SubscriptionNotificationUtils {
    private subscriptionService: SubscriptionService;
    private emailService: EmailService;

    constructor() {
        this.subscriptionService = new SubscriptionService();
        this.emailService = new EmailService();
    }

    /**
     * Sends a new post notification to all active subscribers
     * @param {Object} postData Post data including title, excerpt, and slug
     * @returns {Promise<{sent: number, failed: number}>} Number of emails sent and failed
     */
    async notifySubscribersOfNewPost(postData: {
        title: string;
        excerpt?: string;
        slug: string;
    }): Promise<{ sent: number; failed: number }> {
        try {
            const subscribers = await this.subscriptionService.getActiveSubscriptions();
            
            if (subscribers.length === 0) {
                return { sent: 0, failed: 0 };
            }

            const postUrl = `${config.CORS_ORIGIN}/posts/${postData.slug}`;
            let sent = 0;
            let failed = 0;

            // Send emails to all subscribers
            const emailPromises = subscribers.map(async (subscriber) => {
                try {
                    const unsubscribeUrl = `${config.CORS_ORIGIN}/subscription/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
                    
                    await this.emailService.sendNewPostNotification(
                        subscriber.email,
                        {
                            title: postData.title,
                            excerpt: postData.excerpt,
                            postUrl,
                            unsubscribeUrl,
                        }
                    );
                    sent++;
                } catch (error) {
                    logger.error(`Failed to send notification to ${subscriber.email}`, {
                        email: subscriber.email,
                        error: error instanceof Error ? error.message : error,
                        stack: error instanceof Error ? error.stack : undefined
                    });
                    failed++;
                }
            });

            await Promise.allSettled(emailPromises);

            return { sent, failed };
        } catch (error) {
            logger.error('Error notifying subscribers', {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    /**
     * Sends a custom notification to all active subscribers
     * @param {Object} notificationData Notification data
     * @returns {Promise<{sent: number, failed: number}>} Number of emails sent and failed
     */
    async sendCustomNotification(notificationData: {
        title: string;
        message: string;
        actionUrl?: string;
        buttonText?: string;
        additionalInfo?: string;
    }): Promise<{ sent: number; failed: number }> {
        try {
            const subscribers = await this.subscriptionService.getActiveSubscriptions();
            
            if (subscribers.length === 0) {
                return { sent: 0, failed: 0 };
            }

            let sent = 0;
            let failed = 0;

            // Send emails to all subscribers
            const emailPromises = subscribers.map(async (subscriber) => {
                try {
                    const unsubscribeUrl = `${config.CORS_ORIGIN}/subscription/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
                    
                    await this.emailService.sendNotificationEmail(
                        subscriber.email,
                        {
                            ...notificationData,
                            unsubscribeUrl,
                        }
                    );
                    sent++;
                } catch (error) {
                    logger.error(`Failed to send notification to ${subscriber.email}`, {
                        email: subscriber.email,
                        error: error instanceof Error ? error.message : error,
                        stack: error instanceof Error ? error.stack : undefined
                    });
                    failed++;
                }
            });

            await Promise.allSettled(emailPromises);

            return { sent, failed };
        } catch (error) {
            logger.error('Error sending custom notification', {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
}

export default SubscriptionNotificationUtils;
