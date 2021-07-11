const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const User = {
    posts(parent, args, ctx, info) {
        return prisma.post.findMany({
            where: { author: parent.id, published: true }
        })
    },
    comments(parent, args, ctx, info) {
        return prisma.comment.findMany({ where: { author: parent.id } })
    }
}

module.exports = User