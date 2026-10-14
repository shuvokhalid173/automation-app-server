const db = require('../infrastructure/database');

class UserRepository {
    async findByEmail(email) {
        const [rows] = await db.execute(
            'SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    }

    async findById(id) {
        const [rows] = await db.execute(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    async create({ username, email, password_hash }) {
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, password_hash]
        );
        return result.insertId;
    }
}

module.exports = new UserRepository();
