/**
 * Encryption Utility
 * Handles secure encryption/decryption of sensitive data like API keys
 */

const crypto = require('crypto');

// Use environment variable or generate a default key (should be set in production!)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'noahpro-crm-default-key-32ch'; // 32 chars for AES-256
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

/**
 * Ensure key is exactly 32 bytes for AES-256
 */
const getKey = () => {
    const key = ENCRYPTION_KEY;
    if (key.length < 32) {
        return key.padEnd(32, '0');
    }
    return key.substring(0, 32);
};

/**
 * Encrypt a string value
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:encryptedData (hex encoded)
 */
const encrypt = (text) => {
    if (!text) return '';

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(getKey()), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('Encryption error:', error.message);
        throw new Error('Failed to encrypt data');
    }
};

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
 * @returns {string} - Decrypted plain text
 */
const decrypt = (encryptedText) => {
    if (!encryptedText || !encryptedText.includes(':')) return '';

    try {
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(getKey()), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error.message);
        return ''; // Return empty on error to prevent crashes
    }
};

/**
 * Hash a value (one-way, for comparison purposes)
 * @param {string} text - Text to hash
 * @returns {string} - SHA-256 hash
 */
const hash = (text) => {
    return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Check if a string looks like it's already encrypted (has our format)
 */
const isEncrypted = (text) => {
    if (!text) return false;
    // Our format: 32-char hex IV + ':' + encrypted data
    const parts = text.split(':');
    return parts.length === 2 && parts[0].length === 32 && /^[0-9a-f]+$/i.test(parts[0]);
};

module.exports = {
    encrypt,
    decrypt,
    hash,
    isEncrypted
};
