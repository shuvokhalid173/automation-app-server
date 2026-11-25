const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

module.exports = {
    port: process.env.PORT || 3001,
    env: nodeEnv,
    isProd,
    storageRoot: path.resolve(process.env.STORAGE_ROOT || './storage'),
    corsOrigins: (process.env.CORS_ORIGIN || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean),
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'file_system_wrapper',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    },
    adminEmail: process.env.ADMIN_EMAIL || 'shuvokhalid173@gmail.com',
    adminEmails: (process.env.ADMIN_EMAIL || 'shuvokhalid173@gmail.com')
        .split(',')
        .map(e => e.trim().toLowerCase()),
    jwt: {
        secret: process.env.JWT_SECRET || 'aiaas_jwt_default_secret_key_change_me',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    etsy: {
        keystring: process.env.ETSY_KEYSTRING || '',
        redirectUri: process.env.ETSY_REDIRECT_URI || (isProd ? '' : 'http://localhost:3000/oauth/etsy/callback'),
    },
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    lexoffice: {
        apiBaseUrl: process.env.LEXOFFICE_API_URL || 'https://api.lexoffice.io/v1',
    },
    paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_SECRET || '',
        mode: process.env.PAYPAL_MODE || 'sandbox',
        redirectUri: process.env.PAYPAL_REDIRECT_URI || (isProd ? '' : 'http://localhost:3000/oauth/paypal/callback'),
    },
};

