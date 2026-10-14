const crypto = require('crypto');
const axios = require('axios');
const config = require('../configs');
const ApiResponse = require('../utils/response.util');
const integrationRepository = require('../repositories/integration.repository');
const domainRepository = require('../repositories/domain.repository');

// Temporary in-memory cache for PKCE verifiers mapped by user ID
const pkceStore = new Map();

// PKCE Helper Functions from etsy-auth.js
function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function generateCodeVerifier() {
    return base64URLEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier) {
    return base64URLEncode(crypto.createHash('sha256').update(verifier).digest());
}

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
            const state = crypto.randomBytes(16).toString('hex');

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
}

module.exports = new IntegrationController();
