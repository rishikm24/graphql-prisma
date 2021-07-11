const { RedisPubSub } = require('graphql-redis-subscriptions')
const Redis = require('ioredis')

const redisOptions = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    retryStrategy: times => {
        return Math.min(times * 50, 2000)
    }
}

exports.pubsub = new RedisPubSub({
    publisher: new Redis(redisOptions),
    subscriber: new Redis(redisOptions)
})