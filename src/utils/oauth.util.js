const crypto = require('crypto');

/**
 * Base64 URL encode a Buffer or string according to RFC 7636 (PKCE)
 * @param {Buffer|string} str
 * @returns {string}
 */
function base64URLEncode(str) {
    const buffer = Buffer.isBuffer(str) ? str : Buffer.from(str);
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Generate a cryptographically secure random PKCE code verifier (32 random bytes, base64url encoded)
 * @returns {string}
 */
function generateCodeVerifier() {
    return base64URLEncode(crypto.randomBytes(32));
}

/**
 * Generate a PKCE code challenge from a code verifier using SHA-256
 * @param {string} verifier
 * @returns {string}
 */
function generateCodeChallenge(verifier) {
    return base64URLEncode(crypto.createHash('sha256').update(verifier).digest());
}

/**
 * Generate a cryptographically secure random state parameter for OAuth CSRF protection
 * @returns {string}
 */
function generateState() {
    return crypto.randomBytes(16).toString('hex');
}

module.exports = {
    base64URLEncode,
    generateCodeVerifier,
    generateCodeChallenge,
    generateState,
};
