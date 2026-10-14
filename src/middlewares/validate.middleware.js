const ApiResponse = require('../utils/response.util');

/**
 * Validates that req.params.id is a positive integer
 */
function validateId(req, res, next) {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
        return ApiResponse.error(res, 'Invalid ID parameter', 400);
    }
    req.params.id = id;
    next();
}

module.exports = { validateId };
