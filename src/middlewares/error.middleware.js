const ApiResponse = require('../utils/response.util');

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // MySQL duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        return ApiResponse.error(res, 'Resource already exists', 409);
    }

    // MySQL foreign key constraint
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
        return ApiResponse.error(res, 'Foreign key constraint violation', 409);
    }

    // Validation errors from express
    if (err.statusCode) {
        return ApiResponse.error(res, err.message, err.statusCode);
    }

    return ApiResponse.error(res, err.message || 'Internal Server Error', 500);
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
    return ApiResponse.error(res, `Route ${req.method} ${req.path} not found`, 404);
}

module.exports = { errorHandler, notFoundHandler };
