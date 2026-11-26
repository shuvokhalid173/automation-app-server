const db = require('../infrastructure/database');

class DeviceRepository {
    /**
     * Create a new pending device record when a user downloads a personalized driver.
     */
    async createPendingDevice({
        deviceUuid,
        userId,
        deviceName = null,
        osPlatform = 'windows',
        browserUserAgent = null,
        deviceTokenHash,
        lastIp = null,
    }) {
        const sql = `
            INSERT INTO user_devices (
                device_uuid, user_id, device_name, os_platform,
                browser_user_agent, device_token_hash, status, last_ip
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        `;
        const [result] = await db.execute(sql, [
            deviceUuid,
            userId,
            deviceName,
            osPlatform,
            browserUserAgent ? String(browserUserAgent).slice(0, 500) : null,
            deviceTokenHash,
            lastIp,
        ]);
        return this.findByIdForUser(result.insertId, userId);
    }

    /**
     * Look up a device by its SHA-256 token hash along with owner details.
     */
    async findByTokenHash(tokenHash) {
        const sql = `
            SELECT
                d.*,
                u.username AS owner_username,
                u.email AS owner_email
            FROM user_devices d
            INNER JOIN users u ON u.id = d.user_id
            WHERE d.device_token_hash = ?
            LIMIT 1
        `;
        const [rows] = await db.execute(sql, [tokenHash]);
        return rows[0] || null;
    }

    /**
     * Bind device hardware/OS metadata on first successful connection.
     */
    async markConnected(id, { hostname, osVersion, machineFingerprint, lastIp }) {
        await db.execute(
            `UPDATE user_devices
             SET status = 'connected',
                 hostname = ?,
                 os_version = ?,
                 machine_fingerprint = ?,
                 last_ip = ?,
                 connected_at = NOW(),
                 last_seen_at = NOW()
             WHERE id = ?`,
            [hostname || null, osVersion || null, machineFingerprint || null, lastIp || null, id]
        );
    }

    /**
     * Update last_seen_at & last_ip for an already-connected device.
     */
    async touchLastSeen(id, lastIp) {
        await db.execute(
            `UPDATE user_devices
             SET last_seen_at = NOW(),
                 last_ip = COALESCE(?, last_ip)
             WHERE id = ?`,
            [lastIp || null, id]
        );
    }

    /**
     * List all devices for a user (omits sensitive device_token_hash).
     */
    async listByUser(userId) {
        const [rows] = await db.execute(
            `SELECT
                id, device_uuid, user_id, device_name, os_platform, os_version,
                hostname, machine_fingerprint, status, last_ip,
                connected_at, last_seen_at, created_at, updated_at
             FROM user_devices
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );
        return rows || [];
    }

    async findByIdForUser(id, userId) {
        const [rows] = await db.execute(
            `SELECT
                id, device_uuid, user_id, device_name, os_platform, os_version,
                hostname, machine_fingerprint, status, last_ip,
                connected_at, last_seen_at, created_at, updated_at
             FROM user_devices
             WHERE id = ? AND user_id = ?
             LIMIT 1`,
            [id, userId]
        );
        return rows[0] || null;
    }

    /**
     * Revoke a device belonging to the user.
     */
    async revokeDevice(id, userId) {
        const [result] = await db.execute(
            `UPDATE user_devices
             SET status = 'revoked'
             WHERE id = ? AND user_id = ? AND status != 'revoked'`,
            [id, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = new DeviceRepository();
