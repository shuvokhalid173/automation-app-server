const db = require('../infrastructure/database');

class IntegrationRepository {
    /**
     * Upsert user domain integration tokens
     * @param {number} userId
     * @param {number} domainId
     * @param {string} accessToken
     * @param {string|null} [refreshToken] - null for API-key based platforms (e.g. Lexware)
     */
    async upsertTokens(userId, domainId, accessToken, refreshToken = null) {
        const sql = `
            INSERT INTO user_integrations (user_id, domain_id, access_token, refresh_token, is_connected)
            VALUES (?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
                access_token = VALUES(access_token),
                refresh_token = VALUES(refresh_token),
                is_connected = 1,
                updated_at = NOW()
        `;
        // mysql2's execute() throws on `undefined` bind values, so normalize to null
        const params = [userId, domainId, accessToken ?? null, refreshToken ?? null];
        const [result] = await db.execute(sql, params);
        return result.affectedRows > 0;
    }

    /**
     * Get array of domain_ids that the user has successfully connected
     * @param {number} userId
     * @returns {Promise<number[]>} array of domain_ids
     */
    async getUserIntegrations(userId) {
        const sql = `
            SELECT domain_id
            FROM user_integrations
            WHERE user_id = ? AND is_connected = 1
        `;
        const [rows] = await db.execute(sql, [userId]);
        return rows.map(row => Number(row.domain_id));
    }
}

module.exports = new IntegrationRepository();
