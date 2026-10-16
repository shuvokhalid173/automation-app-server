const jwt = require('jsonwebtoken');
const config = require('../configs');
const ApiResponse = require('../utils/response.util');

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
        return ApiResponse.error(res, 'Authorization token required', 401);
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return ApiResponse.error(res, 'Invalid authorization format. Format must be: Bearer <token>', 401);
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;

        // Match user's email against configured ADMIN_EMAIL in .env
        const userEmail = (decoded.email || '').toLowerCase().trim();
        req.user.isAdmin = config.adminEmails.includes(userEmail);

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return ApiResponse.error(res, 'Token has expired', 401);
        }
        return ApiResponse.error(res, 'Invalid or corrupted token', 401);
    }
}

/**
 * Middleware ensuring only admin users can access the endpoint
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return ApiResponse.error(res, 'Authorization token required', 401);
    }

    const userEmail = (req.user.email || '').toLowerCase().trim();
    const isAdmin = config.adminEmails.includes(userEmail);

    if (!isAdmin) {
        return ApiResponse.error(res, 'Forbidden: Admin access required', 403);
    }

    req.user.isAdmin = true;
    next();
}

module.exports = {
    authenticateToken,
    requireAdmin,
};
