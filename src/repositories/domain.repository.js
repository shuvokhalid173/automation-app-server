const db = require('../infrastructure/database');

class DomainRepository {
    async findAll() {
        const [rows] = await db.execute(
            'SELECT id, name, url, created_at FROM domains ORDER BY name ASC'
        );
        return rows;
    }

    async findById(id) {
        const [rows] = await db.execute(
            'SELECT id, name, url, created_at FROM domains WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    async create({ name, url }) {
        const [result] = await db.execute(
            'INSERT INTO domains (name, url) VALUES (?, ?)',
            [name, url]
        );
        return result.insertId;
    }

    async update(id, { name, url }) {
        const [result] = await db.execute(
            'UPDATE domains SET name = ?, url = ? WHERE id = ?',
            [name, url, id]
        );
        return result.affectedRows > 0;
    }

    async delete(id) {
        // First check if there are mailboxes attached
        const [mailboxes] = await db.execute(
            'SELECT COUNT(*) as count FROM mailboxes WHERE domain_id = ?',
            [id]
        );
        if (mailboxes[0].count > 0) {
            throw new Error('Cannot delete domain because it has attached mailboxes.');
        }

        const [result] = await db.execute(
            'DELETE FROM domains WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = new DomainRepository();
