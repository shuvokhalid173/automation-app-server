const db = require('../infrastructure/database');

const DEFAULT_SETTINGS = {
    timezone: 'Europe/Berlin',
    frequency: 'monthly',
    dayOfMonth: 1,
    day_of_month: 1,
    dayOfWeek: 1,
    day_of_week: 1,
    executionTime: '02:00:00',
    execution_time: '02:00:00',
    isActive: true,
    is_active: true,
};

function formatSettings(row) {
    if (!row) return null;
    return {
        id: row.id,
        user_id: row.user_id,
        userId: row.user_id,
        timezone: row.timezone || DEFAULT_SETTINGS.timezone,
        frequency: row.frequency || DEFAULT_SETTINGS.frequency,
        day_of_month: row.day_of_month !== null && row.day_of_month !== undefined ? Number(row.day_of_month) : DEFAULT_SETTINGS.dayOfMonth,
        dayOfMonth: row.day_of_month !== null && row.day_of_month !== undefined ? Number(row.day_of_month) : DEFAULT_SETTINGS.dayOfMonth,
        day_of_week: row.day_of_week !== null && row.day_of_week !== undefined ? Number(row.day_of_week) : DEFAULT_SETTINGS.dayOfWeek,
        dayOfWeek: row.day_of_week !== null && row.day_of_week !== undefined ? Number(row.day_of_week) : DEFAULT_SETTINGS.dayOfWeek,
        execution_time: row.execution_time ? String(row.execution_time).slice(0, 8) : DEFAULT_SETTINGS.executionTime,
        executionTime: row.execution_time ? String(row.execution_time).slice(0, 8) : DEFAULT_SETTINGS.executionTime,
        is_active: row.is_active !== null && row.is_active !== undefined ? Boolean(row.is_active) : DEFAULT_SETTINGS.isActive,
        isActive: row.is_active !== null && row.is_active !== undefined ? Boolean(row.is_active) : DEFAULT_SETTINGS.isActive,
        updated_at: row.updated_at,
        updatedAt: row.updated_at,
    };
}

class SettingsRepository {
    getDefaults() {
        return { ...DEFAULT_SETTINGS };
    }

    /**
     * Get settings for a specific user
     * @param {number} userId
     * @returns {Promise<object|null>}
     */
    async getSettings(userId) {
        const sql = `
            SELECT id, user_id, timezone, frequency, day_of_month, day_of_week, execution_time, is_active, updated_at
            FROM user_settings
            WHERE user_id = ?
        `;
        const [rows] = await db.execute(sql, [userId]);
        if (!rows || rows.length === 0) {
            return null;
        }
        return formatSettings(rows[0]);
    }

    /**
     * Upsert settings for a user
     * @param {number} userId
     * @param {object} settingsData
     * @returns {Promise<object>} updated settings record
     */
    async upsertSettings(userId, settingsData = {}) {
        const timezone = settingsData.timezone || DEFAULT_SETTINGS.timezone;
        const frequency = settingsData.frequency || DEFAULT_SETTINGS.frequency;

        const rawDayOfMonth = settingsData.dayOfMonth !== undefined ? settingsData.dayOfMonth : settingsData.day_of_month;
        const dayOfMonth = rawDayOfMonth !== undefined && rawDayOfMonth !== null ? Number(rawDayOfMonth) : DEFAULT_SETTINGS.dayOfMonth;

        const rawDayOfWeek = settingsData.dayOfWeek !== undefined ? settingsData.dayOfWeek : settingsData.day_of_week;
        const dayOfWeek = rawDayOfWeek !== undefined && rawDayOfWeek !== null ? Number(rawDayOfWeek) : DEFAULT_SETTINGS.dayOfWeek;

        const rawExecutionTime = settingsData.executionTime || settingsData.execution_time || DEFAULT_SETTINGS.executionTime;
        // Normalize time: e.g. '02:00' -> '02:00:00'
        const executionTime = rawExecutionTime.length === 5 ? `${rawExecutionTime}:00` : rawExecutionTime;

        const rawIsActive = settingsData.isActive !== undefined ? settingsData.isActive : settingsData.is_active;
        const isActive = rawIsActive !== undefined && rawIsActive !== null ? (rawIsActive ? 1 : 0) : 1;

        const sql = `
            INSERT INTO user_settings (
                user_id, timezone, frequency, day_of_month, day_of_week, execution_time, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                timezone = VALUES(timezone),
                frequency = VALUES(frequency),
                day_of_month = VALUES(day_of_month),
                day_of_week = VALUES(day_of_week),
                execution_time = VALUES(execution_time),
                is_active = VALUES(is_active),
                updated_at = NOW()
        `;

        await db.execute(sql, [
            userId,
            timezone,
            frequency,
            dayOfMonth,
            dayOfWeek,
            executionTime,
            isActive,
        ]);

        return this.getSettings(userId);
    }

    /**
     * Get domain routing preferences for connected domains of a specific user
     * @param {number} userId
     * @returns {Promise<Array<object>>}
     */
    async getDomainRouting(userId) {
        const sql = `
            SELECT 
                d.id AS domain_id,
                d.name AS domain_name,
                d.url AS domain_url,
                ui.is_connected,
                ui.type,
                ui.cc_email,
                ui.destination_email,
                ui.destination_api_url
            FROM user_integrations ui
            INNER JOIN domains d ON d.id = ui.domain_id
            WHERE ui.user_id = ? AND ui.is_connected = 1
            ORDER BY d.id ASC
        `;
        const [rows] = await db.execute(sql, [userId]);
        return (rows || []).map(row => ({
            domainId: row.domain_id,
            domainName: row.domain_name,
            domainUrl: row.domain_url,
            isConnected: Boolean(row.is_connected),
            type: row.type || 'email',
            ccEmail: row.cc_email || '',
            destinationEmail: row.destination_email || '',
            destinationApiUrl: row.destination_api_url || '',
        }));
    }

    /**
     * Upsert domain routing preferences for a user
     * @param {number} userId
     * @param {number} domainId
     * @param {object} routingData
     * @returns {Promise<object>} updated routing record for this domain
     */
    async upsertDomainRouting(userId, domainId, { type, ccEmail, destinationEmail, destinationApiUrl }) {
        const finalType = type === 'api' ? 'api' : 'email';
        const finalCcEmail = ccEmail ? String(ccEmail).trim() : null;
        const finalDestEmail = destinationEmail ? String(destinationEmail).trim() : null;
        const finalDestApiUrl = destinationApiUrl ? String(destinationApiUrl).trim() : null;

        const sql = `
            INSERT INTO user_integrations (user_id, domain_id, type, cc_email, destination_email, destination_api_url)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                type = VALUES(type),
                cc_email = VALUES(cc_email),
                destination_email = VALUES(destination_email),
                destination_api_url = VALUES(destination_api_url)
        `;

        await db.execute(sql, [
            userId,
            domainId,
            finalType,
            finalCcEmail,
            finalDestEmail,
            finalDestApiUrl,
        ]);

        const [rows] = await db.execute(
            `SELECT d.id AS domain_id, d.name AS domain_name, d.url AS domain_url,
                    ui.is_connected, ui.type, ui.cc_email, ui.destination_email, ui.destination_api_url
             FROM user_integrations ui
             INNER JOIN domains d ON d.id = ui.domain_id
             WHERE ui.user_id = ? AND ui.domain_id = ?`,
            [userId, domainId]
        );
        if (!rows || rows.length === 0) return null;
        const r = rows[0];
        return {
            domainId: r.domain_id,
            domainName: r.domain_name,
            domainUrl: r.domain_url,
            isConnected: Boolean(r.is_connected),
            type: r.type || 'email',
            ccEmail: r.cc_email || '',
            destinationEmail: r.destination_email || '',
            destinationApiUrl: r.destination_api_url || '',
        };
    }
}

module.exports = new SettingsRepository();
