const express = require('express');
const cors = require('cors');
const config = require('./configs');
const db = require('./infrastructure/database');
const domainRoutes = require('./routes/domain.routes');
const mailboxRoutes = require('./routes/mailbox.routes');
const fileRoutes = require('./routes/file.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// CORS configured from CORS_ORIGIN (.env), allowing same-origin / server-to-server requests with no Origin header
const corsOptions = config.corsOrigins.length > 0
    ? {
        origin: (origin, callback) => {
            if (!origin || config.corsOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS origin not allowed: ${origin}`));
        },
        credentials: true,
    }
    : undefined;

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight health check (Docker / load balancer)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DB-backed readiness/health endpoint
app.get('/api/health', async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
        await db.query('SELECT 1');
        return res.json({ status: 'ok', db: 'connected', timestamp });
    } catch (err) {
        return res.status(503).json({
            status: 'error',
            db: 'disconnected',
            error: err.message,
            timestamp,
        });
    }
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/integrations', require('./routes/integration.routes'));
app.use('/api/domains', domainRoutes);
app.use('/api/mailboxes', mailboxRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/manual-upload', require('./routes/manual-upload.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/devices', require('./routes/device.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// 404 & Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
