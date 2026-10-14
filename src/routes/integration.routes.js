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

module.exports = router;
