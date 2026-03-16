import sanitizeHtml from 'sanitize-html';

/**
 * Configuration for HTML sanitization
 * Allows safe HTML/MDX content while preventing XSS attacks
 */
const sanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span', 'hr', 'del', 'ins', 'sub', 'sup'
    ],
    allowedAttributes: {
        'a': ['href', 'title', 'target', 'rel'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        'code': ['class'],
        'pre': ['class'],
        'div': ['class'],
        'span': ['class'],
        'p': ['class'],
        'h1': ['class'],
        'h2': ['class'],
        'h3': ['class'],
        'h4': ['class'],
        'h5': ['class'],
        'h6': ['class'],
        'table': ['class'],
        'th': ['class', 'colspan', 'rowspan'],
        'td': ['class', 'colspan', 'rowspan']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
        img: ['http', 'https', 'data']
    },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    // Prevent script injection
    disallowedTagsMode: 'discard',
    // Sanitize URLs to prevent javascript: and data: URLs in href/src
    enforceHtmlBoundary: true,
    // Allow class attributes for styling
    allowProtocolRelative: false
};

/**
 * Sanitizes HTML/MDX content to prevent XSS attacks
 * @param content - Raw HTML/MDX content to sanitize
 * @returns Sanitized content safe for display
 */
export function sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
        return '';
    }

    return sanitizeHtml(content, sanitizeOptions);
}

/**
 * Sanitizes a plain text string (removes all HTML)
 * @param text - Text that may contain HTML
 * @returns Plain text without HTML tags
 */
export function sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return sanitizeHtml(text, {
        allowedTags: [],
        allowedAttributes: {}
    });
}

/**
 * Sanitizes user input for titles and other plain text fields
 * @param input - User input string
 * @returns Sanitized plain text
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove HTML tags and trim whitespace
    return sanitizeText(input).trim();
}
