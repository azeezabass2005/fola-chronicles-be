import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { Resend } from 'resend';
import config from '../config/env.config';
import logger from './logger.utils';

/**
 * A single attachment, in a provider-agnostic shape.
 * Mirrors nodemailer's attachment fields; mapped per provider on send.
 */
export interface ProviderAttachment {
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
    cid?: string; // Content-ID for embedded/inline images
}

/**
 * A fully-rendered email, ready to hand to a transport.
 * EmailService builds this after templating; providers only transmit it.
 */
export interface ProviderMessage {
    from: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: ProviderAttachment[];
}

/**
 * Transport strategy. Each provider knows only how to transmit an
 * already-rendered message and how to verify its own connection/config.
 */
export interface EmailProvider {
    /** Human-readable provider name, used in logs */
    readonly name: string;
    /** Transmits a rendered message; resolves with the raw provider response */
    sendRaw(message: ProviderMessage): Promise<unknown>;
    /** Verifies the provider is reachable / correctly configured */
    verify(): Promise<boolean>;
}

/**
 * SMTP transport backed by nodemailer. This is the default provider and
 * preserves the exact behaviour the app had before the driver was introduced.
 */
export class SmtpProvider implements EmailProvider {
    public readonly name = 'smtp';
    private readonly transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.MAIL_HOST || '',
            port: parseInt(config.MAIL_PORT || '587', 10),
            secure: config.MAIL_SECURE === 'true',
            auth: {
                user: config.MAIL_USERNAME || '',
                pass: config.MAIL_PASSWORD || '',
            },
        });
    }

    public async sendRaw(message: ProviderMessage): Promise<unknown> {
        const mailOptions: SendMailOptions = {
            from: message.from,
            to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            cc: message.cc ? (Array.isArray(message.cc) ? message.cc.join(', ') : message.cc) : undefined,
            bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc) : undefined,
            attachments: message.attachments,
        };

        return this.transporter.sendMail(mailOptions);
    }

    public async verify(): Promise<boolean> {
        await this.transporter.verify();
        return true;
    }
}

/**
 * Resend transport backed by the Resend HTTP API. Requires a verified
 * sending domain and RESEND_API_KEY. Unlike nodemailer, the Resend SDK
 * resolves (rather than rejects) on API errors, so we surface `error`
 * as a thrown Error to keep error handling uniform across providers.
 */
export class ResendProvider implements EmailProvider {
    public readonly name = 'resend';
    private readonly client: Resend;

    constructor() {
        if (!config.RESEND_API_KEY) {
            logger.warn('ResendProvider constructed without RESEND_API_KEY; sends will fail');
        }
        this.client = new Resend(config.RESEND_API_KEY);
    }

    public async sendRaw(message: ProviderMessage): Promise<unknown> {
        const { data, error } = await this.client.emails.send({
            from: message.from,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            cc: message.cc,
            bcc: message.bcc,
            attachments: message.attachments?.map(this.mapAttachment),
        } as Parameters<typeof this.client.emails.send>[0]);

        if (error) {
            throw new Error(`${error.name || 'ResendError'}: ${error.message}`);
        }

        return data;
    }

    /**
     * Resend's verification is different from SMTP: there is no connection
     * handshake, so we validate that an API key is present. A misconfigured
     * key surfaces on the first real send.
     */
    public async verify(): Promise<boolean> {
        if (!config.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set');
        }
        return true;
    }

    /** Maps our attachment shape onto Resend's expected fields */
    private mapAttachment(att: ProviderAttachment) {
        return {
            filename: att.filename,
            content: att.content,
            path: att.path,
            contentType: att.contentType,
            contentId: att.cid,
        };
    }
}

/**
 * Selects the transport based on MAIL_PROVIDER. Defaults to SMTP for any
 * unrecognised or unset value so existing deployments keep working.
 * @returns {EmailProvider} The configured provider instance
 */
export const createEmailProvider = (): EmailProvider => {
    const provider = config.MAIL_PROVIDER;

    if (provider === 'resend') {
        logger.info('Email provider: resend');
        return new ResendProvider();
    }

    if (provider && provider !== 'smtp') {
        logger.warn(`Unknown MAIL_PROVIDER "${provider}", falling back to smtp`);
    } else {
        logger.info('Email provider: smtp');
    }

    return new SmtpProvider();
};
