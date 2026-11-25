const db = require('../infrastructure/database');

class JobRepository {
    /**
     * Find any active (pending or running) job for a user.
     * @param {number} userId
     */
    async findActiveJobForUser(userId) {
        const [rows] = await db.execute(
            `SELECT *
             FROM automation_jobs
             WHERE user_id = ? AND status IN ('pending', 'running')
             ORDER BY created_at DESC
             LIMIT 1`,
            [userId]
        );
        return rows[0] || null;
    }

    /**
     * Create a new job record in automation_jobs.
     * @param {object} params
     * @param {number} params.userId
     * @param {string} [params.triggerType='manual']
     * @param {string} [params.platform='all']
     */
    async createJob({ userId, triggerType = 'manual', platform = 'all' }) {
        const [result] = await db.execute(
            `INSERT INTO automation_jobs (user_id, trigger_type, platform, status)
             VALUES (?, ?, ?, 'pending')`,
            [userId, triggerType, platform]
        );
        const [rows] = await db.execute(
            'SELECT * FROM automation_jobs WHERE id = ?',
            [result.insertId]
        );
        return rows[0] || null;
    }

    /**
     * List the latest jobs for a user.
     * @param {number} userId
     * @param {number} [limit=20]
     */
    async getJobsByUser(userId, limit = 20) {
        const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
        const [rows] = await db.query(
            `SELECT id, user_id, trigger_type, platform, status, files_processed,
                    error_message, started_at, completed_at, created_at
             FROM automation_jobs
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ?`,
            [userId, safeLimit]
        );
        return rows || [];
    }
}

module.exports = new JobRepository();
