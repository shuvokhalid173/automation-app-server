const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// All integration endpoints require authentication
router.use(authenticateToken);

// GET /api/integrations/status
router.get('/status', integrationController.getStatus.bind(integrationController));

// GET /api/integrations/etsy/auth
router.get('/etsy/auth', integrationController.getEtsyAuthUrl.bind(integrationController));

// POST /api/integrations/etsy/callback
router.post('/etsy/callback', integrationController.handleEtsyCallback.bind(integrationController));

// GET /api/integrations/paypal/auth
router.get('/paypal/auth', integrationController.getPaypalAuthUrl.bind(integrationController));

// POST /api/integrations/paypal/callback
router.post('/paypal/callback', integrationController.handlePaypalCallback.bind(integrationController));

// POST /api/integrations/connect-direct (API-key based platforms, e.g. Lexware)
router.post('/connect-direct', integrationController.connectDirect.bind(integrationController));

module.exports = router;
