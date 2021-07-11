const jwt = require('jsonwebtoken')

exports.getUserId = (request, requireAuth = true, isSubscriber = false) => {
    try {
        let header
        if (isSubscriber) {
            header = request.connection.context.Authorization
        } else {
            header = request.request.headers.authorization
        }

        if (header) {
            const token = header.replace('Bearer ', '')
            const decoded = jwt.verify(token, 'thissecret')
            return decoded.userId
        }

        if (requireAuth) {
            throw new Error('Authentication required')
        }

        return null
    } catch (err) {
        throw err
    }
}

exports.generateAuthToken = async (userId) => {
    try {
        let token = jwt.sign({ userId }, 'thissecret', { expiresIn: '7 days' })
        return token
    }
    catch (err) {
        throw err
    }
}