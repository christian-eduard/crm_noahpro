/**
 * HTML Sanitizer Utility
 * Cleans HTML content before sending to AI providers to reduce token usage
 * Uses cheerio for efficient HTML parsing
 */

const cheerio = require('cheerio');

/**
 * Elements to completely remove (including their content)
 */
const REMOVE_ELEMENTS = [
    'script',
    'style',
    'noscript',
    'iframe',
    'object',
    'embed',
    'svg',
    'canvas',
    'video',
    'audio',
    'source',
    'track',
    'map',
    'area',
    'picture',
    'template',
    'slot',
    'portal'
];

/**
 * Navigation/UI elements to remove
 */
const REMOVE_UI_ELEMENTS = [
    'nav',
    'header',
    'footer',
    'aside',
    'menu',
    'menuitem',
    'dialog',
    'form', // Usually not relevant for content analysis
    'button',
    'input',
    'select',
    'textarea',
    'label'
];

/**
 * Attributes to remove from all elements
 */
const REMOVE_ATTRIBUTES = [
    'style',
    'class',
    'id',
    'onclick',
    'onload',
    'onerror',
    'onmouseover',
    'data-*',
    'aria-*',
    'role'
];

/**
 * Sanitize HTML content for AI analysis
 * @param {string} html - Raw HTML content
 * @param {Object} options - Sanitization options
 * @returns {Object} - { text: string, wordCount: number, originalSize: number, sanitizedSize: number }
 */
const sanitizeForAI = (html, options = {}) => {
    if (!html || typeof html !== 'string') {
        return {
            text: '',
            wordCount: 0,
            originalSize: 0,
            sanitizedSize: 0,
            savings: '0%'
        };
    }

    const originalSize = html.length;
    const $ = cheerio.load(html, {
        decodeEntities: true,
        normalizeWhitespace: true
    });

    // Remove unwanted elements
    const elementsToRemove = options.keepUI
        ? REMOVE_ELEMENTS
        : [...REMOVE_ELEMENTS, ...REMOVE_UI_ELEMENTS];

    elementsToRemove.forEach(tag => {
        $(tag).remove();
    });

    // Remove comments
    $('*').contents().filter(function () {
        return this.type === 'comment';
    }).remove();

    // Remove hidden elements
    $('[hidden]').remove();
    $('[style*="display:none"]').remove();
    $('[style*="display: none"]').remove();
    $('[style*="visibility:hidden"]').remove();

    // Get text content from body (or the whole document if no body)
    let textContent;
    if ($('body').length) {
        textContent = $('body').text();
    } else {
        textContent = $.text();
    }

    // Clean up whitespace
    textContent = textContent
        .replace(/\s+/g, ' ')           // Multiple spaces to single
        .replace(/\n\s*\n/g, '\n')      // Multiple newlines to single
        .replace(/^\s+|\s+$/gm, '')     // Trim lines
        .trim();

    // Calculate stats
    const sanitizedSize = textContent.length;
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    const savings = originalSize > 0
        ? `${Math.round((1 - sanitizedSize / originalSize) * 100)}%`
        : '0%';

    return {
        text: textContent,
        wordCount,
        originalSize,
        sanitizedSize,
        savings
    };
};

/**
 * Extract specific content sections from HTML
 * @param {string} html - Raw HTML content
 * @returns {Object} - Extracted sections { title, description, mainContent, contactInfo }
 */
const extractSections = (html) => {
    if (!html) return {};

    const $ = cheerio.load(html);

    // Title
    const title = $('title').text().trim() ||
        $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') || '';

    // Description
    const description = $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') || '';

    // Main content areas
    const mainContent = [];
    $('main, article, [role="main"], .content, #content, .main, #main').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) {
            mainContent.push(text.substring(0, 1000));
        }
    });

    // Contact information patterns
    const bodyText = $('body').text();
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phonePattern = /(?:\+34\s?)?(?:\d{3}[\s.-]?\d{3}[\s.-]?\d{3}|\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2})/g;

    const emails = bodyText.match(emailPattern) || [];
    const phones = bodyText.match(phonePattern) || [];

    // Social media links
    const socialLinks = {};
    $('a[href*="instagram.com"]').each((i, el) => {
        socialLinks.instagram = $(el).attr('href');
    });
    $('a[href*="facebook.com"]').each((i, el) => {
        socialLinks.facebook = $(el).attr('href');
    });
    $('a[href*="twitter.com"], a[href*="x.com"]').each((i, el) => {
        socialLinks.twitter = $(el).attr('href');
    });
    $('a[href*="linkedin.com"]').each((i, el) => {
        socialLinks.linkedin = $(el).attr('href');
    });

    return {
        title,
        description,
        mainContent: mainContent.join('\n\n').substring(0, 3000),
        contactInfo: {
            emails: [...new Set(emails)].slice(0, 3),
            phones: [...new Set(phones)].slice(0, 3)
        },
        socialLinks
    };
};

/**
 * Prepare content for AI prompt (combines sanitization and extraction)
 * @param {string} html - Raw HTML
 * @param {number} maxLength - Maximum characters to return
 * @returns {string} - Cleaned text ready for AI prompt
 */
const prepareForPrompt = (html, maxLength = 4000) => {
    const { text } = sanitizeForAI(html);
    const sections = extractSections(html);

    let result = '';

    if (sections.title) {
        result += `TÍTULO: ${sections.title}\n`;
    }
    if (sections.description) {
        result += `DESCRIPCIÓN: ${sections.description}\n`;
    }
    if (sections.contactInfo.emails.length) {
        result += `EMAILS: ${sections.contactInfo.emails.join(', ')}\n`;
    }
    if (sections.contactInfo.phones.length) {
        result += `TELÉFONOS: ${sections.contactInfo.phones.join(', ')}\n`;
    }
    if (Object.keys(sections.socialLinks).length) {
        result += `REDES SOCIALES: ${JSON.stringify(sections.socialLinks)}\n`;
    }

    result += `\nCONTENIDO:\n${text}`;

    return result.substring(0, maxLength);
};

module.exports = {
    sanitizeForAI,
    extractSections,
    prepareForPrompt,
    REMOVE_ELEMENTS,
    REMOVE_UI_ELEMENTS
};
