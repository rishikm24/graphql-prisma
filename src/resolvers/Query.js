const { PrismaClient } = require(".prisma/client")
const prisma = new PrismaClient()
const { getUserId } = require('../utils/auth')
const _ = require('lodash')

const Query = {
    users(parent, args, ctx, info) {
        if (!args.query) {
            return prisma.user.findMany()
        }
        return prisma.user.findMany({ where: { name: { contains: args.query, mode: "insensitive" } } })
    },
    posts(parent, { data }, { request }, info) {
        let userId = getUserId(request)
        let argQuery = {
            where: { author: userId }
        }
        if (data) {
            if (data.query) {
                let temp = _.cloneDeep(argQuery.where)
                argQuery.where.AND = [temp]
                argQuery.where.OR = [
                    { title: { contains: data.query, mode: "insensitive" } },
                    { body: { contains: data.query, mode: "insensitive" } }
                ]
            }
            if (data.skip) {
                argQuery.skip = data.skip
            }
            if (data.take) {
                argQuery.take = data.take
            }
            if (data.cursor) {
                argQuery.cursor = { id: data.cursor }
            }
            if (data.orderBy && data.orderType && ['asc', 'desc'].includes(data.orderType)) {
                argQuery.orderBy = {}
                argQuery.orderBy[data.orderBy] = data.orderType
            }
        }
        return prisma.post.findMany(argQuery)
    },
    comments(parent, args, ctx, info) {
        return prisma.comment.findMany()
    },
    async me(parent, args, { request }, info) {
        let userId = getUserId(request)
        let user = await prisma.user.findFirst({ where: { id: userId } })
        if (!user) {
            throw new Error('User not found')
        }
        return user
    },
    post() {
        return {
            id: '092',
            title: 'GraphQL 101',
            body: '',
            published: false
        }
    }
}

module.exports = Query