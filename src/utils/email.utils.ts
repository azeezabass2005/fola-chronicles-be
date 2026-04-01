import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import config from '../config/env.config';
import logger from './logger.utils';

/**
 * Represents the structure of email template data
 */
interface EmailTemplateData {
    [key: string]: string | number | boolean | undefined;
}

/**
 * Represents an email attachment
 */
interface EmailAttachment {
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
    cid?: string; // Content-ID for embedded images
}

/**
 * Configuration for email sending
 */
interface EmailConfig {
    to: string | string[];
    subject: string;
    template?: string;
    data?: EmailTemplateData;
    html?: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: EmailAttachment[];
}

/**
 * Theme configuration for email templates
 * Matches Fola's Chronicles dark theme from frontend
 */
interface EmailTheme {
    accentColor: string;       // #d4b48a - Warm gold
    accentHover: string;       // #e5cdab - Lighter gold
    background: string;        // #050505 - Deep black
    surface: string;           // #0a0a0a - Slightly lighter
    surfaceAlt: string;        // #111111 - Card/section bg
    border: string;            // #1a1a1a - Subtle border
    textPrimary: string;       // #f3f4f6 - Main text
    textSecondary: string;     // #9ca3af - Muted text
    textMuted: string;         // #6b7280 - Very muted
}

/**
 * A comprehensive email service that provides email sending functionality
 * with custom templating and theme support for Fola's Chronicles
 */
class EmailService {
    /** Nodemailer transporter instance */
    private readonly transporter: Transporter;

    /** Email configuration from environment variables */
    private readonly emailConfig: {
        host: string;
        port: number;
        secure: boolean;
        username: string;
        password: string;
        from: string;
    };

    /** Theme configuration for email templates */
    private readonly theme: EmailTheme;

    /** Available email templates */
    private readonly templates: Map<string, (data: EmailTemplateData) => string>;

    /**
     * Creates an instance of EmailService
     */
    constructor() {
        this.emailConfig = {
            host: config.MAIL_HOST || '',
            port: parseInt(config.MAIL_PORT || '587', 10),
            secure: config.MAIL_SECURE === 'true',
            username: config.MAIL_USERNAME || '',
            password: config.MAIL_PASSWORD || '',
            from: config.MAIL_FROM || 'noreply@folachronicles.com',
        };

        // Fola's Chronicles dark theme colors
        this.theme = {
            accentColor: '#d4b48a',
            accentHover: '#e5cdab',
            background: '#050505',
            surface: '#0a0a0a',
            surfaceAlt: '#111111',
            border: '#1a1a1a',
            textPrimary: '#f3f4f6',
            textSecondary: '#9ca3af',
            textMuted: '#6b7280',
        };

        this.transporter = this.createTransporter();
        this.templates = new Map();
        this.registerTemplates();
    }

    /**
     * Creates and configures the nodemailer transporter
     * @returns {Transporter} Configured nodemailer transporter
     */
    private createTransporter(): Transporter {
        return nodemailer.createTransport({
            host: this.emailConfig.host,
            port: this.emailConfig.port,
            secure: this.emailConfig.secure,
            auth: {
                user: this.emailConfig.username,
                pass: this.emailConfig.password,
            },
        });
    }

    /**
     * Registers all available email templates
     */
    private registerTemplates(): void {
        this.templates.set('subscription-confirmation', this.subscriptionConfirmationTemplate.bind(this));
        this.templates.set('subscription-welcome', this.subscriptionWelcomeTemplate.bind(this));
        this.templates.set('new-post-notification', this.newPostNotificationTemplate.bind(this));
        this.templates.set('notification', this.notificationTemplate.bind(this));
    }

    /**
     * Generates attachment section HTML
     * @param {EmailAttachment[]} attachments Array of attachments
     * @returns {string} HTML for attachments section
     */
    private generateAttachmentsSection(attachments: EmailAttachment[] = []): string {
        if (!attachments || attachments.length === 0) return '';

        const attachmentItems = attachments
            .filter(att => !att.cid) // Exclude inline images
            .map(att => `
                <div style="padding: 10px 0; border-bottom: 1px solid ${this.theme.border};">
                    <div style="display: inline-block; width: 24px; height: 24px; background-color: ${this.theme.accentColor}; opacity: 0.2; vertical-align: middle; margin-right: 10px;"></div>
                    <div style="display: inline-block; vertical-align: middle;">
                        <p style="margin: 0; font-weight: 600; color: ${this.theme.textPrimary}; font-size: 13px; line-height: 1.4;">${att.filename}</p>
                        <p style="margin: 2px 0 0 0; color: ${this.theme.textMuted}; font-size: 12px; line-height: 1.3;">${att.contentType || 'Attachment'}</p>
                    </div>
                </div>
            `).join('');

        return `
            <div style="margin: 24px 0 0 0; padding-top: 20px; border-top: 1px solid ${this.theme.border};">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: ${this.theme.textPrimary};">
                    Attachments (${attachments.filter(att => !att.cid).length})
                </p>
                ${attachmentItems}
            </div>
        `;
    }

    /**
     * Generates the base HTML structure for all email templates
     * @param {string} content The main content to inject into the template
     * @param {EmailAttachment[]} attachments Array of attachments
     * @returns {string} Complete HTML email structure
     */
    private generateBaseTemplate(content: string, attachments: EmailAttachment[] = []): string {
        const attachmentsSection = this.generateAttachmentsSection(attachments);

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Fola's Chronicles</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${this.theme.textPrimary}; background-color: ${this.theme.background};">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${this.theme.background}; padding: 16px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: ${this.theme.surface};">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: ${this.theme.surface}; padding: 24px; border-bottom: 1px solid ${this.theme.border};">
                            <h1 style="margin: 0; color: ${this.theme.accentColor}; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; text-align: center;">
                                Fola's Chronicles
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 24px;">
                            ${content}
                            ${attachmentsSection}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: ${this.theme.surfaceAlt}; padding: 24px; border-top: 1px solid ${this.theme.border};">
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${this.theme.textMuted}; line-height: 1.5; text-align: center;">
                                &copy; ${new Date().getFullYear()} Fola's Chronicles. All rights reserved.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: ${this.theme.textMuted}; line-height: 1.4; text-align: center;">
                                Tech insights, coding tips, and development chronicles
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    }

    /**
     * Subscription confirmation email template
     * @param {EmailTemplateData} data Template data
     * @returns {string} Generated HTML
     */
    private subscriptionConfirmationTemplate(data: EmailTemplateData): string {
        const content = `
            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: ${this.theme.accentColor}; letter-spacing: -0.3px;">
                Confirm Your Subscription
            </h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: ${this.theme.textPrimary};">
                Hi there,
            </p>
            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${this.theme.textSecondary};">
                Thank you for subscribing to Fola's Chronicles newsletter! I'm excited to have you join the community.
            </p>
            ${data.confirmationUrl ? `
            <div style="text-align: center; margin: 24px 0;">
                <a href="${data.confirmationUrl}" style="display: inline-block; background-color: ${this.theme.accentColor}; color: ${this.theme.background}; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 6px;">
                    Confirm Subscription
                </a>
            </div>
            ` : ''}
            <div style="background-color: ${this.theme.surfaceAlt}; border-left: 3px solid ${this.theme.accentColor}; padding: 14px 16px; margin: 20px 0;">
                <p style="margin: 0 0 6px 0; font-weight: 600; font-size: 14px; color: ${this.theme.textPrimary};">What to expect?</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${this.theme.textSecondary};">
                    You'll receive updates about the latest tech insights, interesting math, coding tips, my chronicles, and development best practices.
                </p>
            </div>
            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: ${this.theme.textMuted};">
                If you didn't subscribe to this newsletter, you can safely ignore this email.
            </p>
            <p style="margin: 16px 0 0 0; font-size: 14px; line-height: 1.6; color: ${this.theme.textPrimary};">
                Best regards,<br>
                <strong>Fola</strong>
            </p>
        `;
        return content;
    }

    /**
     * Subscription welcome email template
     * @param {EmailTemplateData} data Template data
     * @returns {string} Generated HTML
     */
    private subscriptionWelcomeTemplate(data: EmailTemplateData): string {
        const content = `
            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: ${this.theme.accentColor}; letter-spacing: -0.3px;">
                Welcome to Fola's Chronicles!
            </h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: ${this.theme.textPrimary};">
                Hi there,
            </p>
            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${this.theme.textSecondary};">
                Your subscription has been confirmed! You're now part of the community and will receive regular updates about:
            </p>
            <div style="background-color: ${this.theme.surfaceAlt}; border-left: 3px solid ${this.theme.accentColor}; padding: 14px 16px; margin: 20px 0;">
                <ul style="margin: 0; padding-left: 20px; color: ${this.theme.textSecondary};">
                    <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.5;">Latest tech insights and trends</li>
                    <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.5;">Interesting math and algorithms</li>
                    <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.5;">Coding tips and best practices</li>
                    <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.5;">My development chronicles and journey</li>
                </ul>
            </div>
            ${data.unsubscribeUrl ? `
            <p style="margin: 20px 0 12px 0; font-size: 14px; line-height: 1.6; color: ${this.theme.textMuted};">
                You can unsubscribe at any time by <a href="${data.unsubscribeUrl}" style="color: ${this.theme.accentColor}; text-decoration: none;">clicking here</a>.
            </p>
            ` : ''}
            <p style="margin: 16px 0 0 0; font-size: 14px; line-height: 1.6; color: ${this.theme.textPrimary};">
                Best regards,<br>
                <strong>Fola</strong>
            </p>
        `;
        return content;
    }

    /**
     * New post notification email template
     * @param {EmailTemplateData} data Template data
     * @returns {string} Generated HTML
     */
    private newPostNotificationTemplate(data: EmailTemplateData): string {
        const content = `
            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: ${this.theme.accentColor}; letter-spacing: -0.3px;">
                New Post: ${data.title || 'Check this out!'}
            </h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: ${this.theme.textPrimary};">
                Hi there,
            </p>
            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${this.theme.textSecondary};">
                I just published a new post that I think you'll find interesting!
            </p>
            ${data.excerpt ? `
            <div style="background-color: ${this.theme.surfaceAlt}; border-left: 3px solid ${this.theme.accentColor}; padding: 14px 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${this.theme.textSecondary}; font-style: italic;">
                    "${data.excerpt}"
                </p>
            </div>
            ` : ''}
            ${data.postUrl ? `
            <div style="text-align: center; margin: 24px 0;">
                <a href="${data.postUrl}" style="display: inline-block; background-color: ${this.theme.accentColor}; color: ${this.theme.background}; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 6px;">
                    Read Post
                </a>
            </div>
            ` : ''}
            ${data.unsubscribeUrl ? `
            <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.6; color: ${this.theme.textMuted}; text-align: center;">
                <a href="${data.unsubscribeUrl}" style="color: ${this.theme.textMuted}; text-decoration: underline;">Unsubscribe</a> from these notifications
            </p>
            ` : ''}
            <p style="margin: 16px 0 0 0; font-size: 14px; line-height: 1.6; color: ${this.theme.textPrimary};">
                Best regards,<br>
                <strong>Fola</strong>
            </p>
        `;
        return content;
    }

    /**
     * General notification email template
     * @param {EmailTemplateData} data Template data
     * @returns {string} Generated HTML
     */
    private notificationTemplate(data: EmailTemplateData): string {
        const content = `
            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: ${this.theme.accentColor}; letter-spacing: -0.3px;">
                ${data.title || 'Notification'}
            </h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: ${this.theme.textPrimary};">
                Hi there,
            </p>
            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${this.theme.textSecondary};">
                ${data.message || 'You have a new notification.'}
            </p>
            ${data.actionUrl ? `
            <div style="text-align: center; margin: 24px 0 20px 0;">
                <a href="${data.actionUrl}" style="display: inline-block; background-color: ${this.theme.accentColor}; color: ${this.theme.background}; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 6px;">
                    ${data.buttonText || 'View Details'}
                </a>
            </div>
            ` : ''}
            ${data.additionalInfo ? `
            <div style="background-color: ${this.theme.surfaceAlt}; border-left: 3px solid ${this.theme.accentColor}; padding: 14px 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${this.theme.textSecondary};">
                    ${data.additionalInfo}
                </p>
            </div>
            ` : ''}
            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: ${this.theme.textPrimary};">
                Best regards,<br>
                <strong>Fola</strong>
            </p>
        `;
        return content;
    }

    /**
     * Replaces placeholders in a string with provided data
     * @param {string} template Template string with placeholders
     * @param {EmailTemplateData} data Data to replace placeholders
     * @returns {string} String with replaced values
     */
    private replacePlaceholders(template: string, data: EmailTemplateData): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key]?.toString() || match;
        });
    }

    /**
     * Centralized error handling for email operations
     * @template R Return type
     * @param {() => Promise<R>} operation The operation to execute
     * @param {string} errorMessage Custom error message
     * @returns {Promise<R>} Result of the operation
     */
    private async executeWithErrorHandling<R>(
        operation: () => Promise<R>,
        errorMessage: string = 'Email operation failed'
    ): Promise<R> {
        try {
            return await operation();
        } catch (error) {
            logger.error(errorMessage, {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : error}`);
        }
    }

    /**
     * Sends an email with the specified configuration
     * @param {EmailConfig} config Email configuration
     * @returns {Promise<any>} Result of the send operation
     */
    public async send(config: EmailConfig): Promise<any> {
        return this.executeWithErrorHandling(async () => {
            const { to, subject, template, data, html, text, cc, bcc, attachments } = config;

            let emailHtml = html;
            let emailText = text;

            // If template is specified, generate HTML from template
            if (template && this.templates.has(template)) {
                const templateFn = this.templates.get(template)!;
                const templateContent = templateFn(data || {});
                emailHtml = this.generateBaseTemplate(templateContent, attachments);
            } else if (template) {
                throw new Error(`Template "${template}" not found`);
            } else if (html) {
                // Wrap custom HTML in base template
                emailHtml = this.generateBaseTemplate(html, attachments);
            }

            // If HTML is provided as a string with placeholders, replace them
            if (emailHtml && data) {
                emailHtml = this.replacePlaceholders(emailHtml, data);
            }

            const mailOptions: SendMailOptions = {
                from: this.emailConfig.from,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject,
                html: emailHtml,
                text: emailText,
                cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
                bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
                attachments,
            };

            return await this.transporter.sendMail(mailOptions);
        }, 'Failed to send email');
    }

    /**
     * Sends a subscription confirmation email
     * @param {string} to Recipient email
     * @param {EmailTemplateData} data Template data
     * @param {EmailAttachment[]} attachments Optional attachments
     * @returns {Promise<any>} Result of the send operation
     */
    public async sendSubscriptionConfirmation(
        to: string, 
        data: EmailTemplateData,
        attachments?: EmailAttachment[]
    ): Promise<any> {
        return this.send({
            to,
            subject: 'Confirm Your Subscription - Fola\'s Chronicles',
            template: 'subscription-confirmation',
            data,
            attachments,
        });
    }

    /**
     * Sends a subscription welcome email
     * @param {string} to Recipient email
     * @param {EmailTemplateData} data Template data
     * @param {EmailAttachment[]} attachments Optional attachments
     * @returns {Promise<any>} Result of the send operation
     */
    public async sendSubscriptionWelcome(
        to: string, 
        data: EmailTemplateData,
        attachments?: EmailAttachment[]
    ): Promise<any> {
        return this.send({
            to,
            subject: 'Welcome to Fola\'s Chronicles Newsletter!',
            template: 'subscription-welcome',
            data,
            attachments,
        });
    }

    /**
     * Sends a new post notification email
     * @param {string} to Recipient email
     * @param {EmailTemplateData} data Template data
     * @param {EmailAttachment[]} attachments Optional attachments
     * @returns {Promise<any>} Result of the send operation
     */
    public async sendNewPostNotification(
        to: string, 
        data: EmailTemplateData,
        attachments?: EmailAttachment[]
    ): Promise<any> {
        return this.send({
            to,
            subject: `New Post: ${data.title || 'Check this out!'} - Fola's Chronicles`,
            template: 'new-post-notification',
            data,
            attachments,
        });
    }

    /**
     * Sends a notification email
     * @param {string} to Recipient email
     * @param {EmailTemplateData} data Template data
     * @param {EmailAttachment[]} attachments Optional attachments
     * @returns {Promise<any>} Result of the send operation
     */
    public async sendNotificationEmail(
        to: string, 
        data: EmailTemplateData,
        attachments?: EmailAttachment[]
    ): Promise<any> {
        return this.send({
            to,
            subject: data.title?.toString() || 'New Notification - Fola\'s Chronicles',
            template: 'notification',
            data,
            attachments,
        });
    }

    /**
     * Verifies the email configuration and connection
     * @returns {Promise<boolean>} True if verification succeeds
     */
    public async verifyConnection(): Promise<boolean> {
        return this.executeWithErrorHandling(async () => {
            await this.transporter.verify();
            return true;
        }, 'Email service verification failed');
    }

    /**
     * Registers a custom template
     * @param {string} name Template name
     * @param {(data: EmailTemplateData) => string} templateFn Template function
     */
    public registerCustomTemplate(
        name: string,
        templateFn: (data: EmailTemplateData) => string
    ): void {
        this.templates.set(name, templateFn);
    }

    /**
     * Gets the base template generator for custom templates
     * @returns {(content: string, attachments?: EmailAttachment[]) => string} Base template function
     */
    public getBaseTemplateGenerator(): (content: string, attachments?: EmailAttachment[]) => string {
        return this.generateBaseTemplate.bind(this);
    }
}

export default EmailService;
export type { EmailAttachment, EmailConfig, EmailTemplateData };
