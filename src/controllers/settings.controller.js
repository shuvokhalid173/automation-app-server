const settingsRepository = require('../repositories/settings.repository');
const ApiResponse = require('../utils/response.util');

class SettingsController {
    /**
     * GET /api/settings
     * Retrieve automation scheduling preferences for the authenticated user
     */
    async getSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const settings = await settingsRepository.getSettings(userId);
            const data = settings || settingsRepository.getDefaults();
            return ApiResponse.success(res, data, 'Automation settings retrieved');
        } catch (err) {
            next(err);
        }
    }

    /**
     * PUT /api/settings
     * Update automation scheduling preferences for the authenticated user
     * Body: { timezone, frequency, dayOfMonth, dayOfWeek, executionTime, isActive }
     */
    async updateSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const {
                timezone,
                frequency,
                dayOfMonth,
                dayOfWeek,
                executionTime,
                isActive,
                // Also accept snake_case variants
                day_of_month,
                day_of_week,
                execution_time,
                is_active,
            } = req.body || {};

            const finalFrequency = (frequency || '').toLowerCase() || undefined;
            if (finalFrequency && !['daily', 'weekly', 'monthly'].includes(finalFrequency)) {
                return ApiResponse.error(res, 'Frequency must be daily, weekly, or monthly', 400);
            }

            const parsedDayOfMonth = dayOfMonth !== undefined ? Number(dayOfMonth) : (day_of_month !== undefined ? Number(day_of_month) : undefined);
            if (parsedDayOfMonth !== undefined && (isNaN(parsedDayOfMonth) || parsedDayOfMonth < 1 || parsedDayOfMonth > 31)) {
                return ApiResponse.error(res, 'Day of month must be between 1 and 31', 400);
            }

            const parsedDayOfWeek = dayOfWeek !== undefined ? Number(dayOfWeek) : (day_of_week !== undefined ? Number(day_of_week) : undefined);
            if (parsedDayOfWeek !== undefined && (isNaN(parsedDayOfWeek) || parsedDayOfWeek < 1 || parsedDayOfWeek > 7)) {
                return ApiResponse.error(res, 'Day of week must be between 1 (Monday) and 7 (Sunday)', 400);
            }

            const finalExecutionTime = executionTime || execution_time;
            if (finalExecutionTime && !/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(finalExecutionTime)) {
                return ApiResponse.error(res, 'Execution time must be in HH:MM or HH:MM:SS format (e.g. 02:00)', 400);
            }

            const finalIsActive = isActive !== undefined ? Boolean(isActive) : (is_active !== undefined ? Boolean(is_active) : undefined);

            const updated = await settingsRepository.upsertSettings(userId, {
                timezone,
                frequency: finalFrequency,
                dayOfMonth: parsedDayOfMonth,
                dayOfWeek: parsedDayOfWeek,
                executionTime: finalExecutionTime,
                isActive: finalIsActive,
            });

            return ApiResponse.success(res, updated, 'Automation settings updated successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/settings/routing
     * Retrieve domain routing settings for the authenticated user
     */
    async getDomainRouting(req, res, next) {
        try {
            const userId = req.user.id;
            const routingList = await settingsRepository.getDomainRouting(userId);
            return ApiResponse.success(res, routingList, 'Domain routing settings retrieved');
        } catch (err) {
            next(err);
        }
    }

    /**
     * PUT /api/settings/routing
     * Update domain routing settings for a specific domain for the authenticated user
     * Accepts: { domainId, type, ccEmail, destinationEmail, destinationApiUrl }
     */
    async updateDomainRouting(req, res, next) {
        try {
            const userId = req.user.id;
            const {
                domainId,
                domain_id,
                type = 'email',
                ccEmail,
                cc_email,
                destinationEmail,
                destination_email,
                destinationApiUrl,
                destination_api_url,
            } = req.body || {};

            const finalDomainId = domainId !== undefined ? Number(domainId) : (domain_id !== undefined ? Number(domain_id) : NaN);
            if (isNaN(finalDomainId) || finalDomainId <= 0) {
                return ApiResponse.error(res, 'Valid domainId is required', 400);
            }

            const finalType = String(type).toLowerCase().trim();
            if (!['email', 'api'].includes(finalType)) {
                return ApiResponse.error(res, "Type must be either 'email' or 'api'", 400);
            }

            const finalCcEmail = ccEmail !== undefined ? String(ccEmail).trim() : (cc_email !== undefined ? String(cc_email).trim() : '');
            const finalDestinationEmail = destinationEmail !== undefined ? String(destinationEmail).trim() : (destination_email !== undefined ? String(destination_email).trim() : '');
            const finalDestinationApiUrl = destinationApiUrl !== undefined ? String(destinationApiUrl).trim() : (destination_api_url !== undefined ? String(destination_api_url).trim() : '');

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (finalCcEmail && !emailRegex.test(finalCcEmail)) {
                return ApiResponse.error(res, 'From / CC Reference Email must be a valid email address', 400);
            }
            if (finalDestinationEmail && !emailRegex.test(finalDestinationEmail)) {
                return ApiResponse.error(res, 'Destination Email must be a valid email address', 400);
            }

            const updated = await settingsRepository.upsertDomainRouting(userId, finalDomainId, {
                type: finalType,
                ccEmail: finalCcEmail,
                destinationEmail: finalDestinationEmail,
                destinationApiUrl: finalDestinationApiUrl,
            });

            return ApiResponse.success(res, updated, 'Domain routing settings updated successfully');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new SettingsController();
