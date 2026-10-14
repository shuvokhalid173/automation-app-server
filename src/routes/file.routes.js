const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const { validateId } = require('../middlewares/validate.middleware');

/**
 * GET /api/files
 * List files with filters & pagination
 */
router.get('/', fileController.getAll.bind(fileController));

/**
 * GET /api/files/:id
 * Get file metadata
 */
router.get('/:id', validateId, fileController.getById.bind(fileController));

/**
 * GET /api/files/:id/view
 * Stream file for viewing (PDF in new tab)
 */
router.get('/:id/view', validateId, fileController.viewFile.bind(fileController));

/**
 * POST /api/files/:id/upload
 * Mark file as uploaded / trigger upload
 */
router.post('/:id/upload', validateId, fileController.uploadFile.bind(fileController));

module.exports = router;
