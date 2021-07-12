// const { pubsub } = require('../common/redis')
const { PubSub } = require('graphql-yoga')
const pubsub = new PubSub()
exports.publishMessage = (triggerName, mutation, type, data) => {
    let publishObj = {}
    publishObj[type] = {
        mutation,
        data
    }
    pubsub.publish(triggerName, publishObj)
}