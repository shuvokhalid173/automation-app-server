const crypto = require('crypto');
const axios = require('axios');
const config = require('../configs');
const ApiResponse = require('../utils/response.util');
const integrationRepository = require('../repositories/integration.repository');
const domainRepository = require('../repositories/domain.repository');
const { encrypt } = require('../utils/encryption.util');
const {
    generateCodeVerifier,
    generateCodeChallenge,
    generateState,
} = require('../utils/oauth.util');
const { ImapFlow } = require('imapflow');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GMX.com (international) uses a different IMAP host than gmx.de / gmx.net / gmx.at / gmx.ch.
 */
function resolveGmxImapHost(email) {
    return /@gmx\.com$/i.test(email) ? 'imap.gmx.com' : 'imap.gmx.net';
}

/**
 * Attempt an IMAP login and immediately log out.
 * Throws on failure; `err.authenticationFailed` is true for bad credentials.
 */
async function validateImapLogin({ host, port = 993, email, password }) {
    const client = new ImapFlow({
        host,
        port,
        secure: true,
        auth: { user: email, pass: password },
        logger: false,
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    });
    // Prevent an unhandled 'error' event from crashing the process
    client.on('error', () => {});

    try {
        await client.connect();
        await client.logout();
    } catch (err) {
        try { client.close(); } catch (_) { /* ignore */ }
        throw err;
    }
}

/**
 * Live-validators for platforms that use direct (non-OAuth) credentials.
 * Each validator throws on failure (axios errors bubble up) and resolves on success.
 */
const directValidators = {
    lexware: async (credentials) => {
        await axios.get(`${config.lexoffice.apiBaseUrl}/profile`, {
            headers: {
                Authorization: `Bearer ${credentials.apiKey}`,
                Accept: 'application/json',
            },
            timeout: 10000,
        });
    },
};

// Temporary in-memory cache for PKCE verifiers and OAuth state mapped by user ID
const pkceStore = new Map();
const paypalStateStore = new Map();

class IntegrationController {
    /**
     * GET /api/integrations/status
     * Returns array of connected domain_ids for current authenticated user
     */
    async getStatus(req, res, next) {
        try {
            const userId = req.user.id;
            const connectedDomainIds = await integrationRepository.getUserIntegrations(userId);
            return ApiResponse.success(res, connectedDomainIds, 'Connected integration IDs retrieved');
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/integrations/etsy/auth
     * Generates PKCE code challenge and returns Etsy OAuth authorization URL
     */
    async getEtsyAuthUrl(req, res, next) {
        try {
            const userId = req.user.id;
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = generateCodeChallenge(codeVerifier);

            // Store verifier for this user
            pkceStore.set(userId, codeVerifier);

            const clientId = config.etsy.keystring || process.env.ETSY_KEYSTRING;
            const redirectUri = config.etsy.redirectUri || process.env.ETSY_REDIRECT_URI || 'http://localhost:3000/oauth/etsy/callback';
            const scopes = 'shops_r transactions_r billing_r';
            const state = generateState();

            const authUrl = `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&client_id=${clientId}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

            return ApiResponse.success(res, { url: authUrl }, 'Etsy authorization URL generated');
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/integrations/etsy/callback
     * Exchanges authorization code for tokens using saved PKCE verifier and persists tokens
     */
    async handleEtsyCallback(req, res, next) {
        try {
            const userId = req.user.id;
            const { code } = req.body || {};

            if (!code) {
                return ApiResponse.error(res, 'Authorization code is required', 400);
            }

            const verifier = pkceStore.get(userId);
            if (!verifier) {
                return ApiResponse.error(res, 'Code verifier not found or session expired. Please restart the authorization flow.', 400);
            }

            const clientId = config.etsy.keystring || process.env.ETSY_KEYSTRING;
            const redirectUri = config.etsy.redirectUri || process.env.ETSY_REDIRECT_URI || 'http://localhost:3000/oauth/etsy/callback';

            // Exchange authorization code for tokens via Etsy API
            let tokenResponse;
            try {
                tokenResponse = await axios.post('https://api.etsy.com/v3/public/oauth/token', {
                    grant_type: 'authorization_code',
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    code,
                    code_verifier: verifier,
                });
            } catch (axiosErr) {
                const errorData = axiosErr.response ? axiosErr.response.data : axiosErr.message;
                console.error('[ERROR] Etsy token exchange failed:', errorData);
                return ApiResponse.error(
                    res,
                    `Failed to exchange token with Etsy: ${errorData.error_description || errorData.error || axiosErr.message}`,
                    400,
                    errorData
                );
            }

            const { access_token, refresh_token } = tokenResponse.data;

            // Remove verifier from cache
            pkceStore.delete(userId);

            // Lookup Etsy domain_id dynamically
            const etsyDomain = await domainRepository.findByName('Etsy');
            if (!etsyDomain) {
                return ApiResponse.error(res, 'Etsy domain record not found in system', 404);
            }

            // Save tokens to normalized user_integrations table
            await integrationRepository.upsertTokens(
                userId,
                etsyDomain.id,
                access_token,
                refresh_token
            );

            return ApiResponse.success(res, {
                domainId: etsyDomain.id,
                domainName: etsyDomain.name,
                isConnected: true,
            }, 'Etsy account connected successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/integrations/connect-direct
     * Body:
     *   Lexware: { domainId, platformName, credentials: { apiKey } }
     *   GMX:     { domainId, platformName, credentials: { email, password } }
     * Validates the credential live against the platform, encrypts it, and stores it.
     */
    async connectDirect(req, res, next) {
        try {
            const userId = req.user.id;
            const { domainId, platformName, credentials } = req.body || {};
            const platformKey = String(platformName || '').toLowerCase();

            if (!domainId || !platformName) {
                return ApiResponse.error(res, 'domainId and platformName are required', 400);
            }
            if (platformKey !== 'lexware' && platformKey !== 'gmx') {
                return ApiResponse.error(res, `Direct connection is not supported for ${platformName}`, 400);
            }

            // Make sure the domainId really belongs to the named platform,
            // so credentials can't be stored against an arbitrary domain.
            const domain = await domainRepository.findById(domainId);
            if (!domain) {
                return ApiResponse.error(res, 'Platform not found', 404);
            }
            if (String(domain.name).toLowerCase() !== platformKey) {
                return ApiResponse.error(res, 'domainId does not match platformName', 400);
            }

            let payloadToEncrypt;

            if (platformKey === 'gmx') {
                // ---------------- GMX (IMAP: email + app password) ----------------
                const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
                // Do NOT trim passwords – whitespace may be significant
                const password = typeof credentials?.password === 'string' ? credentials.password : '';

                if (!email || !password) {
                    return ApiResponse.error(res, 'Email address and App Password are required', 400);
                }
                if (!EMAIL_REGEX.test(email)) {
                    return ApiResponse.error(res, 'Invalid email address format', 400);
                }

                try {
                    await validateImapLogin({ host: resolveGmxImapHost(email), port: 993, email, password });
                } catch (imapErr) {
                    const isNetworkError = !imapErr.authenticationFailed &&
                        ['ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'EAI_AGAIN', 'NoConnection'].includes(imapErr.code);
                    if (isNetworkError) {
                        console.error('[ERROR] GMX IMAP unreachable:', imapErr.code, imapErr.message);
                        return ApiResponse.error(res, 'Could not reach the GMX IMAP server. Please try again later.', 502);
                    }
                    console.warn('[WARN] GMX IMAP login failed:', imapErr.responseText || imapErr.message);
                    return ApiResponse.error(res, 'Invalid GMX credentials or IMAP disabled', 400);
                }

                payloadToEncrypt = JSON.stringify({ email, password });
            } else {
                // ---------------- Lexware (API key) ----------------
                const apiKey = typeof credentials?.apiKey === 'string' ? credentials.apiKey.trim() : '';
                if (!apiKey) {
                    return ApiResponse.error(res, 'API Key is required', 400);
                }

                try {
                    await directValidators.lexware({ apiKey });
                } catch (axiosErr) {
                    const status = axiosErr.response?.status;
                    if (status === 401 || status === 403) {
                        return ApiResponse.error(res, 'Invalid API Key', 400);
                    }
                    if (status === 429) {
                        return ApiResponse.error(res, `${domain.name} rate limit reached. Please try again in a moment.`, 429);
                    }
                    console.error(`[ERROR] ${domain.name} credential validation failed:`, axiosErr.response?.data || axiosErr.message);
                    return ApiResponse.error(res, `Could not reach ${domain.name} to validate the key. Please try again later.`, 502);
                }

                payloadToEncrypt = apiKey;
            }

            // Encryption + storage step (no refresh token for direct-credential platforms)
            const encryptedPayload = encrypt(payloadToEncrypt);
            await integrationRepository.upsertTokens(userId, domain.id, encryptedPayload, null);

            return ApiResponse.success(res, {
                domainId: domain.id,
                domainName: domain.name,
                isConnected: true,
            }, `${domain.name} connected successfully`);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/integrations/paypal/auth
     * Generates state, caches it by userId, and returns PayPal authorization URL
     */
    async getPaypalAuthUrl_(req, res, next) {
        try {
            const userId = req.user.id;
            const state = generateState();

            // Store state in temporary cache to verify on callback
            paypalStateStore.set(userId, state);

            const clientId = config.paypal.clientId || process.env.PAYPAL_CLIENT_ID;
            const redirectUri = config.paypal.redirectUri || process.env.PAYPAL_REDIRECT_URI || 'http://127.0.0.1:3000/oauth/paypal/callback';
            const isLive = String(config.paypal.mode).toLowerCase() === 'live' || String(config.paypal.mode).toLowerCase() === 'production';
            const baseUrl = isLive
                ? (process.env.PAYPAL_LIVE_URL || 'https://www.paypal.com')
                : (process.env.PAYPAL_SANDBOX_URL || 'https://www.sandbox.paypal.com');
            // const scope = 'openid profile email';

            // const authUrl = `${baseUrl}/signin/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

            // const scopes = encodeURIComponent('openid profile email');

            // const authUrl = `${baseUrl}/signin/authorize?client_id=${clientId}&response_type=code&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

            const scopes = encodeURIComponent('openid profile email'); // Add the reporting scope back here only after this works consistently
            const encodedRedirect = encodeURIComponent(redirectUri);

            const authUrl = `${baseUrl}/signin/authorize?client_id=${clientId}&response_type=code&scope=${scopes}&redirect_uri=${encodedRedirect}&state=${state}`;

            return ApiResponse.success(res, { url: authUrl }, 'PayPal authorization URL generated');
        } catch (err) {
            next(err);
        }
    }

    async getPaypalAuthUrl(req, res, next) {
        try {
            const userId = req.user.id;
            const state = generateState();
            paypalStateStore.set(userId, state);

            // 1. Trim to prevent hidden spaces in your .env file
            const clientId = (config.paypal.clientId || process.env.PAYPAL_CLIENT_ID).trim();
            const redirectUri = (config.paypal.redirectUri || process.env.PAYPAL_REDIRECT_URI || 'http://127.0.0.1:3000/oauth/paypal/callback').trim();

            const isLive = String(config.paypal.mode).toLowerCase() === 'live' || String(config.paypal.mode).toLowerCase() === 'production';
            const baseUrl = isLive
                ? (process.env.PAYPAL_LIVE_URL || 'https://www.paypal.com')
                : (process.env.PAYPAL_SANDBOX_URL || 'https://www.sandbox.paypal.com');

            // 2. PayPal strictly requires %20 for spaces. URLSearchParams uses '+', which breaks the router.
            const encodedScopes = encodeURIComponent('openid profile email');
            const encodedRedirect = encodeURIComponent(redirectUri);

            // 3. Use PayPal's modern Identity API endpoint (/connect) instead of the buggy legacy one
            const authUrl = `${baseUrl}/connect?flowEntry=static&client_id=${clientId}&response_type=code&scope=${encodedScopes}&redirect_uri=${encodedRedirect}&state=${state}`;

            return ApiResponse.success(res, { url: authUrl }, 'PayPal authorization URL generated');
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/integrations/paypal/callback
     * Accepts code and state, verifies state against cache, exchanges code for tokens, and persists tokens
     */
    async handlePaypalCallback(req, res, next) {
        try {
            const userId = req.user.id;
            const { code, state, redirectUri: customRedirectUri } = req.body || {};

            if (!code) {
                return ApiResponse.error(res, 'Authorization code is required', 400);
            }
            if (!state) {
                return ApiResponse.error(res, 'State parameter is required', 400);
            }

            const savedState = paypalStateStore.get(userId);
            if (!savedState || savedState !== state) {
                return ApiResponse.error(res, 'Invalid or expired state parameter. Please restart the authorization flow.', 400);
            }

            // Remove state from cache after verification to prevent replay
            paypalStateStore.delete(userId);

            const clientId = config.paypal.clientId || process.env.PAYPAL_CLIENT_ID;
            const clientSecret = config.paypal.clientSecret || process.env.PAYPAL_SECRET;

            const redirectUri = customRedirectUri || config.paypal.redirectUri || process.env.PAYPAL_REDIRECT_URI || 'http://127.0.0.1:3000/oauth/paypal/callback';

            const isLive = String(config.paypal.mode).toLowerCase() === 'live' || String(config.paypal.mode).toLowerCase() === 'production';
            const apiUrl = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

            const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            const bodyParams = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }).toString();

            let tokenResponse;
            try {
                tokenResponse = await axios.post(`${apiUrl}/v1/oauth2/token`, bodyParams, {
                    headers: {
                        'Authorization': `Basic ${basicAuth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: 15000,
                });
            } catch (axiosErr) {
                const errorData = axiosErr.response ? axiosErr.response.data : axiosErr.message;
                console.error('[ERROR] PayPal token exchange failed:', errorData);
                const msg = errorData?.error_description || errorData?.error || errorData?.message || axiosErr.message;
                return ApiResponse.error(
                    res,
                    `Failed to exchange token with PayPal: ${msg}`,
                    400,
                    errorData
                );
            }

            const { access_token, refresh_token } = tokenResponse.data;

            // Lookup PayPal domain record
            const paypalDomain = await domainRepository.findByName('PayPal');
            if (!paypalDomain) {
                return ApiResponse.error(res, 'PayPal domain record not found in system', 404);
            }

            // Upsert tokens in user_integrations
            await integrationRepository.upsertTokens(
                userId,
                paypalDomain.id,
                access_token,
                refresh_token || null
            );

            return ApiResponse.success(res, {
                domainId: paypalDomain.id,
                domainName: paypalDomain.name,
                isConnected: true,
            }, 'PayPal account connected successfully');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new IntegrationController();
