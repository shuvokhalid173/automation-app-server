const mailboxService = require('../services/mailbox.service');
const ApiResponse = require('../utils/response.util');

class MailboxController {
    async get(req, res, next) {
        try {
            if (req.query.domain_id) {
                const domainId = parseInt(req.query.domain_id, 10);
                if (Number.isNaN(domainId) || domainId <= 0) {
                    return ApiResponse.error(res, 'domain_id must be a positive integer', 400);
                }
                const mailboxes = await mailboxService.getMailboxesByDomain(domainId);
                return ApiResponse.success(res, mailboxes);
            } else {
                const mailboxes = await mailboxService.getAllMailboxes();
                return ApiResponse.success(res, mailboxes);
            }
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const { name, email, is_active, domain_id } = req.body;
            if (!name || !email || !domain_id) {
                return res.status(400).json({ success: false, message: 'Name, email, and domain_id are required' });
            }
            const mailbox = await mailboxService.createMailbox({ name, email, is_active: is_active ? 1 : 0, domain_id });
            return ApiResponse.success(res, mailbox, 201);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Mailbox with this email and domain already exists' });
            if (err.statusCode === 404) return res.status(404).json({ success: false, message: err.message });
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const { name, email, is_active, domain_id } = req.body;
            if (!name || !email || !domain_id) {
                return res.status(400).json({ success: false, message: 'Name, email, and domain_id are required' });
            }
            const mailbox = await mailboxService.updateMailbox(req.params.id, { name, email, is_active: is_active ? 1 : 0, domain_id });
            return ApiResponse.success(res, mailbox);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Mailbox with this email and domain already exists' });
            if (err.statusCode === 404) return res.status(404).json({ success: false, message: err.message });
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            await mailboxService.deleteMailbox(req.params.id);
            return ApiResponse.success(res, { message: 'Mailbox deleted successfully' });
        } catch (err) {
            if (err.statusCode === 404) return res.status(404).json({ success: false, message: err.message });
            if (err.message.includes('attached files')) return res.status(400).json({ success: false, message: err.message });
            next(err);
        }
    }
}

module.exports = new MailboxController();
