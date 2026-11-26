const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const deviceRepository = require('../repositories/device.repository');
const ApiResponse = require('../utils/response.util');

function sha256Hex(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return String(forwarded).split(',')[0].trim().slice(0, 64);
    }
    return String(req.ip || req.socket?.remoteAddress || '').slice(0, 64);
}

/**
 * Escape characters that could break batch/PowerShell single-quoted literals.
 */
function sanitizeTemplateValue(val) {
    return String(val || '')
        .replace(/[\r\n]/g, '')
        .replace(/'/g, "''")
        .replace(/%/g, '%%');
}

function resolveTemplatePath() {
    const baseDir = process.env.DRIVER_TEMPLATE_DIR
        ? path.resolve(process.env.DRIVER_TEMPLATE_DIR)
        : path.resolve(__dirname, '../../../desktop-client-driver-app/windows-native-driver');
    return path.join(baseDir, 'aiaas-windows-driver.bat.template');
}

class DeviceController {
    /**
     * POST /api/devices/download/windows
     * Authenticated user endpoint: creates a pending device entry with a unique
     * token and streams a personalized Windows .bat connector script.
     */
    async downloadWindowsDriver(req, res, next) {
        try {
            const userId = req.user.id;
            const rawName = req.body && typeof req.body.deviceName === 'string' ? req.body.deviceName.trim() : '';
            const deviceName = rawName ? rawName.slice(0, 100) : `Windows PC (${req.user.username || req.user.email})`;

            const deviceUuid = crypto.randomUUID();
            const deviceToken = crypto.randomBytes(32).toString('hex');
            const deviceTokenHash = sha256Hex(deviceToken);

            await deviceRepository.createPendingDevice({
                deviceUuid,
                userId,
                deviceName,
                osPlatform: 'windows',
                browserUserAgent: req.headers['user-agent'] || null,
                deviceTokenHash,
                lastIp: getClientIp(req),
            });

            const templatePath = resolveTemplatePath();
            if (!fs.existsSync(templatePath)) {
                return ApiResponse.error(res, 'Windows driver template not found on server', 500);
            }

            const rawProto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
            const inferredBaseUrl = `${rawProto}://${req.get('host')}`;
            const apiBaseUrl = (process.env.PUBLIC_API_URL || inferredBaseUrl).replace(/\/+$/, '');

            let script = fs.readFileSync(templatePath, 'utf8');
            script = script
                .replace(/\{\{API_BASE_URL\}\}/g, sanitizeTemplateValue(apiBaseUrl))
                .replace(/\{\{DEVICE_UUID\}\}/g, sanitizeTemplateValue(deviceUuid))
                .replace(/\{\{DEVICE_TOKEN\}\}/g, sanitizeTemplateValue(deviceToken))
                .replace(/\{\{USER_EMAIL\}\}/g, sanitizeTemplateValue(req.user.email))
                .replace(/\{\{DEVICE_NAME\}\}/g, sanitizeTemplateValue(deviceName));

            // Normalize to Windows CRLF for clean cmd.exe execution
            script = script.replace(/\r?\n/g, '\r\n');

            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', 'attachment; filename="aiaas-windows-driver.bat"');
            res.setHeader('X-Device-UUID', deviceUuid);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Device-UUID');
            return res.status(200).send(script);
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/devices/connect
     * Device webhook invoked by the local Windows driver script.
     * Verifies deviceUuid + deviceToken hash, binds machine_fingerprint on first
     * run, and rejects attempts from revoked or different/shared machines.
     */
    async connectDevice(req, res, next) {
        try {
            const {
                deviceUuid,
                deviceToken: bodyToken,
                hostname,
                osPlatform = 'windows',
                osVersion,
                machineFingerprint,
            } = req.body || {};

            const deviceToken = bodyToken || req.headers['x-device-token'];

            if (!deviceUuid || !deviceToken) {
                return ApiResponse.error(res, 'deviceUuid and deviceToken are required', 400);
            }

            const tokenHash = sha256Hex(deviceToken);
            const device = await deviceRepository.findByTokenHash(tokenHash);

            if (!device || device.device_uuid !== String(deviceUuid).trim()) {
                return ApiResponse.error(res, 'Invalid device credentials', 401);
            }

            if (device.status === 'revoked') {
                return ApiResponse.error(res, 'This device has been revoked by the account owner', 403);
            }

            const cleanFingerprint = machineFingerprint ? String(machineFingerprint).trim().slice(0, 255) : null;
            const cleanHostname = hostname ? String(hostname).trim().slice(0, 255) : null;
            const cleanOsVersion = osVersion ? String(osVersion).trim().slice(0, 100) : null;
            const lastIp = getClientIp(req);

            if (device.status === 'pending') {
                if (!cleanFingerprint) {
                    return ApiResponse.error(res, 'machineFingerprint is required to bind a new device', 400);
                }

                await deviceRepository.markConnected(device.id, {
                    hostname: cleanHostname,
                    osVersion: cleanOsVersion,
                    machineFingerprint: cleanFingerprint,
                    lastIp,
                });

                const updated = await deviceRepository.findByIdForUser(device.id, device.user_id);
                return ApiResponse.success(res, {
                    connected: true,
                    firstConnection: true,
                    device: updated,
                    user: {
                        id: device.user_id,
                        username: device.owner_username,
                        email: device.owner_email,
                    },
                }, 'Device authenticated and connected');
            }

            // Already connected: enforce anti-sharing machine fingerprint check
            if (
                device.machine_fingerprint &&
                cleanFingerprint &&
                device.machine_fingerprint !== cleanFingerprint
            ) {
                return ApiResponse.error(
                    res,
                    'Device mismatch: this driver is bound to another Windows machine and cannot be shared.',
                    403
                );
            }

            await deviceRepository.touchLastSeen(device.id, lastIp);
            const refreshed = await deviceRepository.findByIdForUser(device.id, device.user_id);

            return ApiResponse.success(res, {
                connected: true,
                firstConnection: false,
                device: refreshed,
                user: {
                    id: device.user_id,
                    username: device.owner_username,
                    email: device.owner_email,
                },
            }, 'Device heartbeat authenticated');
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/devices
     * List devices registered by the authenticated user.
     */
    async listDevices(req, res, next) {
        try {
            const devices = await deviceRepository.listByUser(req.user.id);
            return ApiResponse.success(res, devices, 'User devices retrieved');
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /api/devices/:id
     * Revoke a registered device belonging to the authenticated user.
     */
    async revokeDevice(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id) || id <= 0) {
                return ApiResponse.error(res, 'Invalid device id', 400);
            }

            const revoked = await deviceRepository.revokeDevice(id, req.user.id);
            if (!revoked) {
                return ApiResponse.error(res, 'Device not found or already revoked', 404);
            }

            return ApiResponse.success(res, { id, status: 'revoked' }, 'Device revoked successfully');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new DeviceController();
