const db = require('../infrastructure/database');

class MailboxRepository {
    async findByDomainId(domainId) {
        const [rows] = await db.execute(
            `SELECT id, name, email, is_active, domain_id, created_at
             FROM mailboxes
             WHERE domain_id = ?
             ORDER BY name ASC`,
            [domainId]
        );
        return rows;
    }

    async findAll() {
        const [rows] = await db.execute(
            `SELECT m.id, m.name, m.email, m.is_active, m.domain_id, m.created_at, d.name as domain_name
             FROM mailboxes m
             JOIN domains d ON d.id = m.domain_id
             ORDER BY d.name ASC, m.name ASC`
        );
        return rows;
    }

    async findById(id) {
        const [rows] = await db.execute(
            `SELECT id, name, email, is_active, domain_id, created_at
             FROM mailboxes WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    async create({ name, email, is_active, domain_id }) {
        const [result] = await db.execute(
            'INSERT INTO mailboxes (name, email, is_active, domain_id) VALUES (?, ?, ?, ?)',
            [name, email, is_active, domain_id]
        );
        return result.insertId;
    }

    async update(id, { name, email, is_active, domain_id }) {
        const [result] = await db.execute(
            'UPDATE mailboxes SET name = ?, email = ?, is_active = ?, domain_id = ? WHERE id = ?',
            [name, email, is_active, domain_id, id]
        );
        return result.affectedRows > 0;
    }

    async delete(id) {
        // We will prevent deleting mailboxes if they have files attached
        const [files] = await db.execute(
            'SELECT COUNT(*) as count FROM files WHERE mailbox_id = ?',
            [id]
        );
        if (files[0].count > 0) {
            throw new Error('Cannot delete mailbox because it has files attached.');
        }

        const [result] = await db.execute(
            'DELETE FROM mailboxes WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = new MailboxRepository();
