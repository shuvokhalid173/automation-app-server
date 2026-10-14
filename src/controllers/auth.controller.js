const authService = require('../services/auth.service');
const ApiResponse = require('../utils/response.util');

class AuthController {
    async register(req, res, next) {
        try {
            const { username, email, password } = req.body || {};
            const result = await authService.register(username, email, password);
            return ApiResponse.success(res, result, 'Registration successful', 201);
        } catch (err) {
            next(err);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body || {};
            const result = await authService.login(email, password);
            return ApiResponse.success(res, result, 'Login successful', 200);
        } catch (err) {
            next(err);
        }
    }

    async me(req, res, next) {
        try {
            return ApiResponse.success(res, { user: req.user }, 'Current user profile');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AuthController();
