const fs = require('fs');
const path = require('path');
const { resolveSafeStoragePath, sanitizeFileName } = require('../utils/storage.util');

const ALLOWED_DESTINATIONS = new Set(['ebay', 'google-ads']);

const uploadFile = async (req, res) => {
  try {
    const destinationKey = String(req.params.destination || '').toLowerCase();

    if (!ALLOWED_DESTINATIONS.has(destinationKey)) {
      return res.status(400).json({ error: 'Invalid destination' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Append timestamp to sanitized original name
    const cleanOriginal = sanitizeFileName(req.file.originalname);
    const ext = path.extname(cleanOriginal);
    const base = path.basename(cleanOriginal, ext);
    const timestamp = Date.now();
    const finalFilename = `${base}_${timestamp}${ext}`;

    const relativePath = path.join('manual', destinationKey, finalFilename);
    const finalPath = resolveSafeStoragePath(relativePath);

    await fs.promises.mkdir(path.dirname(finalPath), { recursive: true });
    await fs.promises.writeFile(finalPath, req.file.buffer);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      path: relativePath,
      filename: finalFilename,
    });
  } catch (error) {
    console.error('Error in manual upload:', error);
    res.status(error.statusCode || 500).json({
      error: 'Failed to upload file',
      details: error.message,
    });
  }
};

module.exports = {
  uploadFile,
};
