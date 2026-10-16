const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domain.controller');
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware');

/**
 * GET /api/domains
 * List all domains
 */
router.get('/', domainController.getAll.bind(domainController));
router.post('/', authenticateToken, requireAdmin, domainController.create.bind(domainController));
router.put('/:id', authenticateToken, requireAdmin, domainController.update.bind(domainController));
router.delete('/:id', authenticateToken, requireAdmin, domainController.delete.bind(domainController));

module.exports = router;
