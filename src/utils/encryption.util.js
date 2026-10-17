const crypto = require('crypto');
const config = require('../configs');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

/**
 * Resolve and validate the 32-byte key required by AES-256.
 * Validated lazily so a missing key only breaks encryption, not server boot.
 */
function getKey() {
    const key = config.encryptionKey;
    if (!key || Buffer.byteLength(key, 'utf8') !== 32) {
        throw new Error('ENCRYPTION_KEY must be set to exactly 32 characters in .env');
    }
    return Buffer.from(key, 'utf8');
}

/**
 * Encrypt a plaintext string.
 * @param {string} text
 * @returns {string} formatted as `ivHex:encryptedHex`
 */
function encrypt(text) {
    if (text === null || text === undefined) return null;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a string produced by `encrypt()`.
 * @param {string} encryptedText formatted as `ivHex:encryptedHex`
 * @returns {string} original plaintext
 */
function decrypt(encryptedText) {
    if (encryptedText === null || encryptedText === undefined) return null;

    const [ivHex, dataHex] = String(encryptedText).split(':');
    if (!ivHex || !dataHex) {
        throw new Error('Invalid encrypted payload format (expected ivHex:encryptedHex)');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);

    return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
