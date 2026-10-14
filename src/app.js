const express = require('express');
const cors = require('cors');
const domainRoutes = require('./routes/domain.routes');
const mailboxRoutes = require('./routes/mailbox.routes');
const fileRoutes = require('./routes/file.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/integrations', require('./routes/integration.routes'));
app.use('/api/domains', domainRoutes);
app.use('/api/mailboxes', mailboxRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/manual-upload', require('./routes/manual-upload.routes'));

// 404 & Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
