const redisClient = require('../config/redis');

class MessageBroker {
  /**
   * Gửi một sự kiện (event) đến một channel của Redis.
   * @param {string} channel - Tên của channel, ví dụ: 'restaurant_events'
   * @param {object} event - Đối tượng sự kiện cần gửi đi.
   */
  async publish(channel, event) {
    try {
      // Chuyển đổi object thành chuỗi JSON
      const message = JSON.stringify(event);

      // Sử dụng lệnh PUBLISH của Redis
      await redisClient.publish(channel, message);

      console.log(`✅ [Redis Pub/Sub] Published to channel '${channel}': ${message}`);
    } catch (error) {
      console.error('❌ Error publishing message to Redis:', error);
    }
  }
}

module.exports = new MessageBroker();