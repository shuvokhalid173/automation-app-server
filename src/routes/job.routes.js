const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.use(authenticateToken);

router.post('/trigger', jobController.trigger.bind(jobController));
router.get('/', jobController.list.bind(jobController));

module.exports = router;
