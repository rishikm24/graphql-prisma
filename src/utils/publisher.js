const { RedisPubSub } = require('graphql-redis-subscriptions')
const pubSub = new RedisPubSub()

exports.publishMessage = (triggerName, mutation, type, data) => {
    let publishObj = {}
    publishObj[type] = {
        mutation,
        data
    }
    pubSub.publish(triggerName, publishObj)
}