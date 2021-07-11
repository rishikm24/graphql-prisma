const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getUserId, generateAuthToken } = require('../utils/auth')
const { publishMessage } = require('../utils/publisher')
const { MUTATION_TYPE } = require('../common/constants')
const { hashPassword } = require('../utils/hashpassword')

const Mutation = {
    async createUser(parent, args, ctx, info) {
        try {
            if (!args.data.email) {
                throw new Error('Email missing')
            }
            if (!args.data.password) {
                throw new Error('Password missing')
            }

            const emailTaken = await prisma.user.findMany({
                where: { email: args.data.email }
            })
            if (emailTaken.length > 0) {
                throw new Error('Email taken')
            }
            if (args.data.password.length < 8) {
                throw new Error('Password must be 8 characters or longer')
            }

            const password = await hashPassword(args.data.password)

            const userData = {
                ...args.data,
                password
            }

            const user = await prisma.user.create({
                data: userData
            })
            let token = await generateAuthToken(user.id)
            return { user, token }
        } catch (err) {
            console.log(err)
        }
    },
    async loginUser(parent, args, ctx, info) {
        try {
            if (!args.data.email || !args.data.password) {
                throw new Error('Email or Password missing')
            }

            let user = await prisma.user.findUnique({ where: { email: args.data.email } })
            if (!user) {
                throw new Error('User not found')
            }
            const passwordcheck = bcryptjs.compareSync(args.data.password, user.password)
            if (!passwordcheck) {
                throw new Error('Incorrect password')
            }
            let token = await generateAuthToken(user.id)
            return { user, token }
        } catch (err) {
            console.log(err)
            throw err
        }

    },
    async deleteUser(parent, args, { request }, info) {
        let userId = getUserId(request)
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!user) {
            throw new Error('User not found')
        }

        let userPosts = await prisma.post.findMany({
            where: { author: userId }
        })

        await prisma.$transaction([
            //delete posts & users first -- cascade drop
            prisma.post.deleteMany({ where: { author: userId } }),
            prisma.comment.deleteMany({
                where: {
                    OR: [
                        { author: userId },
                        { post: { in: userPosts.map(o => o.id) } }
                    ]
                }
            }),
            prisma.user.delete({ where: { id: userId } })
        ])

        return user
    },
    async updateUser(parent, { data }, { request }, info) {
        let id = getUserId(request)
        const user = await prisma.user.findUnique({ where: { id } })

        if (!user) {
            throw new Error('User not found')
        }

        if (typeof data.password == 'string') {
            user.password = await hashPassword(data.password)
        }

        if (typeof data.email === 'string') {
            const emailTaken = await prisma.user.findFirst({ where: { email: data.email, id: { not: id } } })

            if (emailTaken) {
                throw new Error('Email taken')
            }

            user.email = data.email
        }

        if (typeof data.name === 'string') {
            user.name = data.name
        }

        if (typeof data.age !== 'undefined') {
            user.age = data.age
        }

        await prisma.user.update({ data: { ...user }, where: { id } })

        return user
    },
    async createPost(parent, args, { request, pubsub }, info) {
        const userId = getUserId(request)
        const userExists = await prisma.user.findFirst({ where: { id: userId } })

        if (!userExists) {
            throw new Error('User not found')
        }

        let post = args.data
        args.data.author = userId


        post = await prisma.post.create({ data: post })

        if (args.data.published) {
            publishMessage(`post ${post.author}`, MUTATION_TYPE.CREATED, 'post', post)
        }

        return post
    },
    async deletePost(parent, args, { request }, info) {
        const id = Number(args.id)
        const userId = getUserId(request)
        const postExsits = await prisma.post.findFirst({
            where: { id, author: userId }
        })
        const comments = await prisma.comment.findMany({
            where: { post: id }
        })
        let commentIds = comments.map(o => o.id)

        if (!postExsits) {
            throw new Error('Post not found')
        }

        if (postExsits.published) {
            publishMessage(`post ${postExsits.author}`, MUTATION_TYPE.DELETED, 'post', postExsits)
        }

        await prisma.$transaction([
            prisma.comment.deleteMany({ where: { id: { in: commentIds } } }),
            prisma.post.delete({ where: { id } })
        ])

        return postExsits
    },
    async updatePost(parent, args, { request }, info) {
        let { id, data } = args
        id = Number(id)
        let userId = getUserId(request)
        let post = await prisma.post.findFirst({ where: { id, author: userId } })
        const originalPost = { ...post }

        if (!post) {
            throw new Error('Post not found')
        }

        if (originalPost.published && data.published == false) {
            await prisma.comment.deleteMany({ where: { post: id } })
        }

        if (typeof data.title === 'string') {
            post.title = data.title
        }

        if (typeof data.body === 'string') {
            post.body = data.body
        }

        if (typeof data.published === 'boolean') {
            post.published = data.published

            if (originalPost.published && !post.published) {
                publishMessage(`post ${originalPost.author}`, MUTATION_TYPE.DELETED, 'post', originalPost)
            } else if (!originalPost.published && post.published) {
                publishMessage(`post ${post.author}`, MUTATION_TYPE.CREATED, 'post', post)
            }
        } else if (post.published) {
            publishMessage(`post ${post.author}`, MUTATION_TYPE.UPDATED, 'post', post)
        }

        post = await prisma.post.update({ data: { ...post }, where: { id } })

        return post
    },
    async createComment(parent, { data }, { request }, info) {
        let userId = getUserId(request)
        let postId = Number(data.post)
        const userExists = await prisma.user.findUnique({ where: { id: userId } })
        const postExists = await prisma.post.findFirst({ where: { id: postId, published: true } })

        if (!userExists) {
            throw new Error('Unable to find user')
        }

        if (!postExists) {
            throw new Error('Unable to find post')
        }

        data.author = userId
        data.post = postId
        let comment = data


        comment = await prisma.comment.create({ data: comment })
        publishMessage(`comment ${data.post}`, MUTATION_TYPE.CREATED, 'comment', comment)

        return comment
    },
    async deleteComment(parent, args, { request }, info) {
        let commentId = Number(args.id)
        let userId = getUserId(request)
        const commentExists = await prisma.comment.findFirst({ where: { id: commentId, author: userId } })

        if (!commentExists) {
            throw new Error('Comment not found')
        }

        let deletedComment = await prisma.comment.delete({ where: { id: commentId } })
        publishMessage(`comment ${deletedComment.post}`, MUTATION_TYPE.DELETED, 'comment', deletedComment)

        return deletedComment
    },
    async updateComment(parent, args, { request }, info) {
        let { id, data } = args
        let userId = getUserId(request)
        id = Number(id)
        let comment = await prisma.comment.findFirst({ where: { id, author: userId } })

        if (!comment) {
            throw new Error('Comment not found')
        }

        if (typeof data.text === 'string') {
            comment.text = data.text
        }

        comment = await prisma.comment.update({ data: { ...comment }, where: { id } })
        publishMessage(`comment ${comment.post}`, MUTATION_TYPE.UPDATED, 'comment', comment)

        return comment
    }
}

module.exports = Mutation