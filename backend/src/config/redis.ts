import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on('error', (err) => {
    console.error('Redis connection error', err)
})
redisClient.on('connect', () => {
    console.log('Redis connected')
});

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

export default redisClient;