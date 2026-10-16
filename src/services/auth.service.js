const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const config = require('../configs');

class AuthService {
    /**
     * Register a new user
     * @param {string} username
     * @param {string} email
     * @param {string} password
     */
    async register(username, email, password) {
        if (!username || !email || !password) {
            const error = new Error('Username, email, and password are required');
            error.statusCode = 400;
            throw error;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            const error = new Error('Invalid email address format');
            error.statusCode = 400;
            throw error;
        }

        // Check if user with email already exists
        const existing = await userRepository.findByEmail(email.toLowerCase().trim());
        if (existing) {
            const error = new Error('A user with this email already exists');
            error.statusCode = 409;
            throw error;
        }

        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert user
        const normalizedEmail = email.toLowerCase().trim();
        const userId = await userRepository.create({
            username: username.trim(),
            email: normalizedEmail,
            password_hash,
        });

        const newUser = await userRepository.findById(userId);

        // Generate JWT token
        const token = this.generateToken(newUser);
        const isAdmin = config.adminEmails.includes(newUser.email.toLowerCase().trim());

        return {
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                isAdmin,
                created_at: newUser.created_at,
            },
        };
    }

    /**
     * Authenticate user credentials and return JWT
     * @param {string} email
     * @param {string} password
     */
    async login(email, password) {
        if (!email || !password) {
            const error = new Error('Email and password are required');
            error.statusCode = 400;
            throw error;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await userRepository.findByEmail(normalizedEmail);

        if (!user) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const token = this.generateToken(user);
        const isAdmin = config.adminEmails.includes(user.email.toLowerCase().trim());

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin,
                created_at: user.created_at,
            },
        };
    }

    /**
     * Generate JWT for user
     * @param {object} user
     */
    generateToken(user) {
        const isAdmin = config.adminEmails.includes(user.email.toLowerCase().trim());
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin,
        };

        const secret = config.jwt.secret;
        const expiresIn = config.jwt.expiresIn;

        return jwt.sign(payload, secret, { expiresIn });
    }
}

module.exports = new AuthService();
