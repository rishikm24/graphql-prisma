const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { getUserId } = require('../utils/auth')

exports.Subscription = {
    comment: {
        subscribe: async (parent, { postId }, { pubsub, request }, info) => {
            const userId = getUserId(request, true, true)
            const post = await prisma.post.findFirst({ where: { id: Number(postId), published: true, author: userId } })

            if (!post) {
                throw new Error('Post not found')
            }
            return pubsub.asyncIterator(`comment ${postId}`)
        }
    },
    post: {
        subscribe: async (parent, args, { pubsub, request }, info) => {
            const userId = getUserId(request, true, true)
            const user = await prisma.user.findFirst({ where: { id: userId } })
            if (!user) {
                throw new Error('User not found')
            }
            return pubsub.asyncIterator(`post ${userId}`)
        }
    }
}
