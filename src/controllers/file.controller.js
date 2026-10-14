const fileService = require('../services/file.service');
const ApiResponse = require('../utils/response.util');
const path = require('path');

class FileController {
    async getAll(req, res, next) {
        try {
            const filters = {
                domain_id: req.query.domain_id,
                mailbox_id: req.query.mailbox_id,
                downloaded_year_month: req.query.downloaded_year_month,
                uploaded_year_month: req.query.uploaded_year_month,
                page: req.query.page || 1,
                limit: req.query.limit || 20,
            };
            const result = await fileService.getFiles(filters);
            return ApiResponse.success(res, result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req, res, next) {
        try {
            const file = await fileService.getFileById(req.params.id);
            return ApiResponse.success(res, file);
        } catch (err) {
            next(err);
        }
    }

    async viewFile(req, res, next) {
        try {
            const { file, stream } = await fileService.getFileStream(req.params.id);
            const ext = path.extname(file.original_name).toLowerCase();

            // Set appropriate content type
            const mimeTypes = {
                '.pdf': 'application/pdf',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.txt': 'text/plain',
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
            stream.pipe(res);
        } catch (err) {
            next(err);
        }
    }

    async uploadFile(req, res, next) {
        try {
            const { destination } = req.body || {};
            const result = await fileService.uploadFile(req.params.id, destination);
            return ApiResponse.success(res, result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new FileController();
