const express = require('express');
const router = express.Router();
const mailboxController = require('../controllers/mailbox.controller');
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware');

/**
 * GET /api/mailboxes?domain_id=1
 * List mailboxes for a specific domain
 */
router.get('/', mailboxController.get.bind(mailboxController));
router.post('/', authenticateToken, requireAdmin, mailboxController.create.bind(mailboxController));
router.put('/:id', authenticateToken, requireAdmin, mailboxController.update.bind(mailboxController));
router.delete('/:id', authenticateToken, requireAdmin, mailboxController.delete.bind(mailboxController));
module.exports = router;
