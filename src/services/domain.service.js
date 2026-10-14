const domainRepository = require('../repositories/domain.repository');

class DomainService {
    async getAllDomains() {
        return domainRepository.findAll();
    }

    async createDomain(data) {
        const id = await domainRepository.create(data);
        return domainRepository.findById(id);
    }

    async updateDomain(id, data) {
        const updated = await domainRepository.update(id, data);
        if (!updated) {
            throw new Error('Domain not found');
        }
        return domainRepository.findById(id);
    }

    async deleteDomain(id) {
        const deleted = await domainRepository.delete(id);
        if (!deleted) {
            throw new Error('Domain not found');
        }
        return { success: true };
    }
}

module.exports = new DomainService();
