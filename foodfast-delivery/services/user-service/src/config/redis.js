const Redis = require('ioredis');

// Đọc thông tin kết nối từ biến môi trường đã định nghĩa trong docker-compose.yml
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis successfully!');
});

redisClient.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

module.exports = redisClient;