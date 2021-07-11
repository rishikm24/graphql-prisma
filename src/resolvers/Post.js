const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const Post = {
    author(parent, args, ctx, info) {
        // console.log(`authorrr: ${parent.author}`)
        return prisma.user.findUnique({ where: { id: Number(parent.author) } })
    },
    comments(parent, args, vtx, info) {
        return prisma.comment.findUnique({ where: { id: parent.id } })
    }
}

module.exports = Post