const fs = require('fs');
const path = require('path');

const DESTINATIONS = {
  ebay: '/Users/kq/Desktop/Programming/business-automation/downloads/eBay',
  'google-ads': '/Users/kq/Desktop/Programming/business-automation/downloads/google-ads'
};

const uploadFile = async (req, res) => {
  try {
    const destinationKey = req.params.destination;
    const destPath = DESTINATIONS[destinationKey];

    if (!destPath) {
      return res.status(400).json({ error: 'Invalid destination' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Ensure the directory exists
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    // Append timestamp to original name
    const ext = path.extname(req.file.originalname);
    const base = path.basename(req.file.originalname, ext);
    const timestamp = Date.now();
    const finalFilename = `${base}_${timestamp}${ext}`;
    
    const finalPath = path.join(destPath, finalFilename);

    // If using memoryStorage, req.file.buffer contains the file
    // If using diskStorage, req.file.path contains the temp file path
    // We will use memoryStorage in the route to avoid temp file cleanup issues.
    fs.writeFileSync(finalPath, req.file.buffer);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      path: finalPath,
      filename: finalFilename
    });
  } catch (error) {
    console.error('Error in manual upload:', error);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
};

module.exports = {
  uploadFile
};
