const domainService = require('../services/domain.service');
const ApiResponse = require('../utils/response.util');

class DomainController {
    async getAll(req, res, next) {
        try {
            const domains = await domainService.getAllDomains();
            return ApiResponse.success(res, domains);
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const { name, url, description, connection_details } = req.body;
            if (!name || !url) return res.status(400).json({ success: false, message: 'Name and URL are required' });
            const domain = await domainService.createDomain({ name, url, description, connection_details });
            return ApiResponse.success(res, domain, 201);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Domain with this URL already exists' });
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const { name, url, description, connection_details } = req.body;
            if (!name || !url) return res.status(400).json({ success: false, message: 'Name and URL are required' });
            const domain = await domainService.updateDomain(req.params.id, { name, url, description, connection_details });
            return ApiResponse.success(res, domain);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Domain with this URL already exists' });
            if (err.message === 'Domain not found') return res.status(404).json({ success: false, message: err.message });
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            await domainService.deleteDomain(req.params.id);
            return ApiResponse.success(res, { message: 'Domain deleted successfully' });
        } catch (err) {
            if (err.message === 'Domain not found') return res.status(404).json({ success: false, message: err.message });
            if (err.message.includes('attached mailboxes')) return res.status(400).json({ success: false, message: err.message });
            next(err);
        }
    }
}

module.exports = new DomainController();
