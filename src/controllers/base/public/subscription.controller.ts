import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/base-controller";
import SubscriptionService from "../../../services/subscription.service";
import EmailService from "../../../utils/email.utils";
import errorResponseMessage from "../../../common/messages/error-response-message";
import { ErrorResponseCode } from "../../../common/types";
import { ErrorSeverity } from "../../../common/types";
import config from "../../../config/env.config";
import logger from "../../../utils/logger.utils";

/**
 * Controller handling subscription-related operations
 * @class SubscriptionController
 * @extends BaseController
 */
class SubscriptionController extends BaseController {
    private subscriptionService: SubscriptionService;
    private emailService: EmailService;

    /**
     * Creates an instance of SubscriptionController
     */
    constructor() {
        super();
        this.subscriptionService = new SubscriptionService();
        this.emailService = new EmailService();
    }

    /**
     * Sets up routes for subscription operations
     * @protected
     */
    protected setupRoutes(): void {
        // Subscribe route
        this.router.post("/subscribe", this.subscribe.bind(this));

        // Confirm subscription route
        this.router.get("/confirm/:token", this.confirmSubscription.bind(this));

        // Unsubscribe route
        this.router.post("/unsubscribe", this.unsubscribe.bind(this));
    }

    /**
     * Subscribes an email address to the newsletter
     * @private
     */
    private async subscribe(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { email } = req.body;

            if (!email) {
                next(errorResponseMessage.payloadIncorrect("Email is required"));
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                next(errorResponseMessage.createError(
                    ErrorResponseCode.VALIDATION_ERROR,
                    "Invalid email format",
                    ErrorSeverity.LOW
                ));
                return;
            }

            // Create or update subscription
            const subscription = await this.subscriptionService.createSubscription(email);

            // If already confirmed, return success without sending email
            if (subscription.isConfirmed) {
                this.sendSuccess(res, {
                    message: "You are already subscribed to our newsletter!",
                    email: subscription.email
                });
                return;
            }

            // Generate confirmation URL
            const confirmationUrl = `${config.CORS_ORIGIN}/subscription/confirm/${subscription.confirmationToken}`;
            const unsubscribeUrl = `${config.CORS_ORIGIN}/subscription/unsubscribe?email=${encodeURIComponent(subscription.email)}`;

            // Send confirmation email
            try {
                await this.emailService.sendSubscriptionConfirmation(
                    subscription.email,
                    {
                        confirmationUrl,
                        unsubscribeUrl,
                    }
                );
            } catch (emailError) {
                // Log email error but don't fail the subscription
                logger.error('Failed to send confirmation email', {
                    error: emailError instanceof Error ? emailError.message : String(emailError),
                    email: subscription.email,
                    stack: emailError instanceof Error ? emailError.stack : undefined
                });
            }

            this.sendSuccess(res, {
                message: "Subscription request received! Please check your email to confirm your subscription.",
                email: subscription.email
            }, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Confirms a subscription using the confirmation token
     * @private
     */
    private async confirmSubscription(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { token } = req.params;

            if (!token) {
                next(errorResponseMessage.payloadIncorrect("Confirmation token is required"));
                return;
            }

            const subscription = await this.subscriptionService.confirmSubscription(token);

            if (!subscription) {
                next(errorResponseMessage.createError(
                    ErrorResponseCode.RESOURCE_NOT_FOUND,
                    "Invalid or expired confirmation token",
                    ErrorSeverity.LOW
                ));
                return;
            }

            // Send welcome email
            const unsubscribeUrl = `${config.CORS_ORIGIN}/subscription/unsubscribe?email=${encodeURIComponent(subscription.email)}`;
            
            try {
                await this.emailService.sendSubscriptionWelcome(
                    subscription.email,
                    {
                        unsubscribeUrl,
                    }
                );
            } catch (emailError) {
                // Log email error but don't fail the confirmation
                logger.error('Failed to send welcome email', {
                    error: emailError instanceof Error ? emailError.message : String(emailError),
                    email: subscription.email,
                    stack: emailError instanceof Error ? emailError.stack : undefined
                });
            }

            // Redirect to success page or return JSON
            if (req.headers.accept?.includes('text/html')) {
                res.redirect(`${config.CORS_ORIGIN}/subscription/confirmed`);
            } else {
                this.sendSuccess(res, {
                    message: "Subscription confirmed successfully! Welcome to Fola's Safe Space newsletter!",
                    email: subscription.email
                });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Unsubscribes an email address from the newsletter
     * @private
     */
    private async unsubscribe(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { email } = req.body;

            if (!email) {
                next(errorResponseMessage.payloadIncorrect("Email is required"));
                return;
            }

            const subscription = await this.subscriptionService.unsubscribe(email);

            if (!subscription) {
                next(errorResponseMessage.createError(
                    ErrorResponseCode.RESOURCE_NOT_FOUND,
                    "Email not found in our subscription list",
                    ErrorSeverity.LOW
                ));
                return;
            }

            this.sendSuccess(res, {
                message: "You have been successfully unsubscribed from our newsletter.",
                email: subscription.email
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new SubscriptionController().router;
