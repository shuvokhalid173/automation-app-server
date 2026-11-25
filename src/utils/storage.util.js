const path = require('path');
const config = require('../configs');

/**
 * Return resolved root directory for persisted documents.
 */
function getStorageRoot() {
    return path.resolve(config.storageRoot);
}

/**
 * Sanitize a file name so it cannot contain path separators or header-breaking characters.
 */
function sanitizeFileName(name) {
    return path.basename(String(name || 'file')).replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Safely resolve a stored file path against STORAGE_ROOT (or legacy src/file_storage).
 * Rejects path traversal attempts outside allowed storage directories.
 */
function resolveSafeStoragePath(storedPath) {
    if (!storedPath || typeof storedPath !== 'string' || storedPath.includes('\0')) {
        const err = new Error('Invalid file path');
        err.statusCode = 400;
        throw err;
    }

    const storageRoot = getStorageRoot();
    const legacyRoot = path.resolve(__dirname, '../file_storage');

    if (path.isAbsolute(storedPath)) {
        const normalized = path.resolve(storedPath);
        const inStorage = normalized === storageRoot || normalized.startsWith(storageRoot + path.sep);
        const inLegacy = normalized === legacyRoot || normalized.startsWith(legacyRoot + path.sep);
        if (!inStorage && !inLegacy) {
            const err = new Error('Access denied: file path is outside allowed storage root');
            err.statusCode = 403;
            throw err;
        }
        return normalized;
    }

    const resolved = path.resolve(storageRoot, storedPath);
    if (resolved !== storageRoot && !resolved.startsWith(storageRoot + path.sep)) {
        const err = new Error('Invalid file path traversal attempt');
        err.statusCode = 403;
        throw err;
    }
    return resolved;
}

module.exports = {
    getStorageRoot,
    sanitizeFileName,
    resolveSafeStoragePath,
};
