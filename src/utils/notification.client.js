'use strict';

const axios = require('axios');
const crypto = require('crypto');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_TOKEN = process.env.NOTIFICATION_SERVICE_TOKEN || '';

/**
 * Lightweight client to send notifications from app-server to the Notification Microservice.
 * Designed to be non-blocking and fault-tolerant for app-server workflows.
 */
class NotificationClient {
  constructor(baseUrl = NOTIFICATION_SERVICE_URL, token = NOTIFICATION_SERVICE_TOKEN) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  /**
   * @param {object} params
   * @param {string} params.category             e.g. 'invoice_sync', 'auth_alert'
   * @param {string} [params.priority='normal']  'low' | 'normal' | 'high'
   * @param {Array<object>} params.recipients    [{ userId, email, webhookUrl, deviceToken, locale }]
   * @param {Array<string>} [params.channels=['email']] ['email', 'webhook', 'push_ios', 'push_android']
   * @param {object} [params.template]           { key: 'invoice.uploaded', locale: 'de' }
   * @param {object} [params.data]               Payload variables for template rendering
   * @param {string} [params.idempotencyKey]     Unique key to prevent duplicate sends on retries
   * @param {string} [params.sendAt]             Optional ISO string for delayed send
   * @returns {Promise<{ success: boolean, notificationId?: string, error?: string }>}
   */
  async send({
    category,
    priority = 'normal',
    recipients,
    channels = ['email'],
    template,
    data = {},
    idempotencyKey,
    sendAt = null,
  }) {
    const key = idempotencyKey || crypto.randomUUID();

    try {
      const res = await axios.post(
        `${this.baseUrl}/v1/notifications`,
        {
          category,
          priority,
          recipients,
          channels,
          template,
          data,
          sendAt,
          metadata: {
            source: 'app-server',
            timestamp: new Date().toISOString(),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Idempotency-Key': key,
            'Content-Type': 'application/json',
          },
          timeout: 4000,
        }
      );

      return {
        success: true,
        notificationId: res.data?.data?.notificationId,
        replayed: res.data?.data?.replayed || false,
      };
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      console.warn(`[NotificationClient] Warning: Failed to send notification (${category}): ${msg}`);
      return {
        success: false,
        error: msg,
      };
    }
  }
}

module.exports = new NotificationClient();

