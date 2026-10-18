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
}

module.exports = new SettingsRepository();
