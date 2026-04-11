const Redis = require('ioredis');

// Create a globally persistent Redis client instance
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Successfully connected to Redis'));

module.exports = redis;
