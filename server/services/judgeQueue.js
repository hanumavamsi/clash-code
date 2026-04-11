const { Queue } = require('bullmq');
const redis = require('../redisClient');

const judgeQueue = new Queue('judgeQueue', { connection: redis });

module.exports = judgeQueue;
