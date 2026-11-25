const jobRepository = require('../repositories/job.repository');
const ApiResponse = require('../utils/response.util');

const ALLOWED_PLATFORMS = new Map([
    ['all', 'all'],
    ['gmx', 'GMX'],
    ['lexware', 'Lexware'],
    ['etsy', 'Etsy'],
    ['paypal', 'PayPal'],
    ['ebay', 'eBay'],
]);

class JobController {
    /**
     * POST /api/jobs/trigger
     * Body: { platform?: 'all' | 'GMX' | 'Lexware' | 'Etsy' | 'PayPal' | 'eBay' }
     */
    async trigger(req, res, next) {
        try {
            const userId = req.user.id;
            const rawPlatform = (req.body && req.body.platform) ? String(req.body.platform).trim() : 'all';
            const normalizedPlatform = ALLOWED_PLATFORMS.get(rawPlatform.toLowerCase());

            if (!normalizedPlatform) {
                return ApiResponse.error(
                    res,
                    `Unsupported platform "${rawPlatform}". Allowed: all, GMX, Lexware, Etsy, PayPal, eBay`,
                    400
                );
            }

            const existingActive = await jobRepository.findActiveJobForUser(userId);
            if (existingActive) {
                return ApiResponse.error(
                    res,
                    `A sync job (#${existingActive.id}) is already ${existingActive.status}. Please wait for it to finish.`,
                    409,
                    existingActive
                );
            }

            const job = await jobRepository.createJob({
                userId,
                triggerType: 'manual',
                platform: normalizedPlatform,
            });

            return ApiResponse.success(res, job, 'Sync job queued', 201);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/jobs
     * Returns latest 20 jobs for the authenticated user
     */
    async list(req, res, next) {
        try {
            const jobs = await jobRepository.getJobsByUser(req.user.id, 20);
            return ApiResponse.success(res, jobs, 'Jobs retrieved');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new JobController();
