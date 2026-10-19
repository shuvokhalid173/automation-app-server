const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware');
const domainController = require('../controllers/domain.controller');
const mailboxController = require('../controllers/mailbox.controller');
const ApiResponse = require('../utils/response.util');

// All routes in /api/admin require authenticated admin credentials
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/admin/verify
 * Verifies admin privileges
 */
router.get('/verify', (req, res) => {
    return ApiResponse.success(res, {
        isAdmin: true,
        email: req.user.email,
        userId: req.user.id,
    }, 'Admin verified');
});

/**
 * Domains Admin Endpoints
 */
router.get('/domains', domainController.getAll.bind(domainController));
router.post('/domains', domainController.create.bind(domainController));
router.put('/domains/:id', domainController.update.bind(domainController));
router.delete('/domains/:id', domainController.delete.bind(domainController));

/**
 * Mailboxes Admin Endpoints
 */
router.get('/mailboxes', mailboxController.get.bind(mailboxController));
router.post('/mailboxes', mailboxController.create.bind(mailboxController));
router.put('/mailboxes/:id', mailboxController.update.bind(mailboxController));
router.delete('/mailboxes/:id', mailboxController.delete.bind(mailboxController));

module.exports = router;
