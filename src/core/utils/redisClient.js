const Redis = require("ioredis");
const { REDIS_HOST, REDIS_PORT } = require("../../config/config");

const redisClient = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT || 6379),
});

module.exports = redisClient;

