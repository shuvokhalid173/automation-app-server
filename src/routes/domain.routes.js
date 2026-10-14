const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domain.controller');

/**
 * GET /api/domains
 * List all domains
 */
router.get('/', domainController.getAll.bind(domainController));
router.post('/', domainController.create.bind(domainController));
router.put('/:id', domainController.update.bind(domainController));
router.delete('/:id', domainController.delete.bind(domainController));

module.exports = router;
