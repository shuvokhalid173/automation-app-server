const express = require('express');
const router = express.Router();
const mailboxController = require('../controllers/mailbox.controller');

/**
 * GET /api/mailboxes?domain_id=1
 * List mailboxes for a specific domain
 */
router.get('/', mailboxController.get.bind(mailboxController));
router.post('/', mailboxController.create.bind(mailboxController));
router.put('/:id', mailboxController.update.bind(mailboxController));
router.delete('/:id', mailboxController.delete.bind(mailboxController));
module.exports = router;
