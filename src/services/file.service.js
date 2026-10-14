const fileRepository = require('../repositories/file.repository');
const fs = require('fs');
const path = require('path');

class FileService {
    async getFiles(filters) {
        return fileRepository.findAll(filters);
    }

    async getFileById(id) {
        const file = await fileRepository.findById(id);
        if (!file) {
            const error = new Error('File not found');
            error.statusCode = 404;
            throw error;
        }
        return file;
    }

    async getFileStream(id) {
        const file = await this.getFileById(id);
        const filePath = file.local_file_location;

        if (!fs.existsSync(filePath)) {
            const error = new Error('File not found on disk');
            error.statusCode = 404;
            throw error;
        }

        return { file, stream: fs.createReadStream(filePath) };
    }

    async uploadFile(id, destination) {
        const file = await this.getFileById(id);

        if (file.is_uploaded_to_destination) {
            const error = new Error('File already uploaded');
            error.statusCode = 409;
            throw error;
        }

        // TODO: Implement actual upload logic here (S3, FTP, etc.)
        // For now, we simulate by updating the DB record
        const uploadDestination = destination || 'mock-destination';
        const success = await fileRepository.markAsUploaded(id, uploadDestination);

        if (!success) {
            const error = new Error('Failed to mark file as uploaded');
            error.statusCode = 500;
            throw error;
        }

        return { success: true, message: 'File uploaded successfully' };
    }
}

module.exports = new FileService();
