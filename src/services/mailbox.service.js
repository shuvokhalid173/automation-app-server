const mailboxRepository = require('../repositories/mailbox.repository');
const domainRepository = require('../repositories/domain.repository');

class MailboxService {
    async getMailboxesByDomain(domainId) {
        const domain = await domainRepository.findById(domainId);
        if (!domain) {
            const error = new Error('Domain not found');
            error.statusCode = 404;
            throw error;
        }
        return mailboxRepository.findByDomainId(domainId);
    }

    async getAllMailboxes() {
        return mailboxRepository.findAll();
    }

    async createMailbox(data) {
        // Verify domain exists
        const domain = await domainRepository.findById(data.domain_id);
        if (!domain) {
            const error = new Error('Domain not found');
            error.statusCode = 404;
            throw error;
        }
        const id = await mailboxRepository.create(data);
        return mailboxRepository.findById(id);
    }

    async updateMailbox(id, data) {
        // Verify domain exists
        const domain = await domainRepository.findById(data.domain_id);
        if (!domain) {
            const error = new Error('Domain not found');
            error.statusCode = 404;
            throw error;
        }
        const updated = await mailboxRepository.update(id, data);
        if (!updated) {
            const error = new Error('Mailbox not found');
            error.statusCode = 404;
            throw error;
        }
        return mailboxRepository.findById(id);
    }

    async deleteMailbox(id) {
        const deleted = await mailboxRepository.delete(id);
        if (!deleted) {
            const error = new Error('Mailbox not found');
            error.statusCode = 404;
            throw error;
        }
        return { success: true };
    }
}

module.exports = new MailboxService();
