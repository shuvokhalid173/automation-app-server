const express = require('express');
const multer = require('multer');
const router = express.Router();
const manualUploadController = require('../controllers/manual-upload.controller');

// Use memory storage so we have the buffer available in the controller
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only pdf
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Mount the route: /api/manual-upload/:destination
router.post('/:destination', upload.single('file'), manualUploadController.uploadFile);

module.exports = router;
