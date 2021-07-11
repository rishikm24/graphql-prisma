const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const Comment = {
    author(parent, args, ctx, info) {
        return prisma.user.findUnique({ where: { id: parent.author } })
    },
    post(parent, args, ctx, info) {
        return prisma.post.findUnique({ where: { id: parent.post } })
    }
}

module.exports = Comment