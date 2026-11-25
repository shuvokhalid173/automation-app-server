const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// All settings routes require user authentication
router.use(authenticateToken);

// GET /api/settings - retrieve user automation preferences
router.get('/', settingsController.getSettings.bind(settingsController));

// PUT /api/settings - update user automation preferences
router.put('/', settingsController.updateSettings.bind(settingsController));

// GET /api/settings/routing - retrieve domain routing configurations
router.get('/routing', settingsController.getDomainRouting.bind(settingsController));

// PUT /api/settings/routing - update domain routing configuration
router.put('/routing', settingsController.updateDomainRouting.bind(settingsController));

module.exports = router;
