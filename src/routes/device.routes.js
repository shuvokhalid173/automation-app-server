const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Device-authenticated webhook (uses deviceUuid + deviceToken, not user browser JWT)
router.post('/connect', deviceController.connectDevice.bind(deviceController));

// User-authenticated device management & driver download endpoints
router.post('/download/windows', authenticateToken, deviceController.downloadWindowsDriver.bind(deviceController));
router.get('/', authenticateToken, deviceController.listDevices.bind(deviceController));
router.delete('/:id', authenticateToken, deviceController.revokeDevice.bind(deviceController));

module.exports = router;
