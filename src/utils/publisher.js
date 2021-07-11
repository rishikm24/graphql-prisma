const { pubsub } = require('../common/redis')
exports.publishMessage = (triggerName, mutation, type, data) => {
    let publishObj = {}
    publishObj[type] = {
        mutation,
        data
    }
    pubsub.publish(triggerName, publishObj)
}