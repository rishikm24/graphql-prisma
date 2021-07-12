const { GraphQLServer, PubSub } = require('graphql-yoga')
const dotenv = require('dotenv')
const db = require('./db')
const Query = require('./resolvers/Query')
const Mutation = require('./resolvers/Mutation')
const { Subscription } = require('./resolvers/Subscription')
const User = require('./resolvers/User')
const Post = require('./resolvers/Post')
const Comment = require('./resolvers/Comment')
// const { pubsub } = require('./common/redis')
const pubsub = new PubSub()

dotenv.config({
    path: './.env'
})

const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers: {
        Query,
        Mutation,
        Subscription,
        User,
        Post,
        Comment
    },
    context(request) {
        return {
            db,
            pubsub,
            request
        }
    }
})

server.start({ port: process.env.port || 4000 }, () => {
    console.log('The server is up!')
})