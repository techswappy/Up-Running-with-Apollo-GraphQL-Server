//const { ApolloServer } = require('apollo-server');
const { ApolloServerLambda, AuthenticationError } = require('apollo-server-lambda');
const { ApolloServer } = require('apollo-server-express');
const isEmail = require('isemail');
const jwt = require('jsonwebtoken');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');
const { createStore } = require('./store');

require('dotenv').config();

const store = createStore();

const getDataSources = () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store })
});

const getContext = async ({ req }) => {
    // Note! This example uses the `req` object to access headers,
    // but the arguments received by `context` vary by integration.
    // This means they will vary for Express, Koa, Lambda, etc.!
    //
    // To find out the correct arguments for a specific integration,
    // see the `context` option in the API reference for `apollo-server`:
    // https://www.apollographql.com/docs/apollo-server/api/apollo-server/

    // Get the user token from the headers.
    let token = req.headers && req.headers.authorization || '';

    // verify a token symmetric - synchronous
    try {
        if (token.includes("Bearer")) {
            token = token.split("Bearer ")[1];
        }
        const data = jwt.verify(token, process.env.JWT_SECRET);

        // find a user by their email
        const users = await store.users.findOrCreate({ where: { email: data.email } });
        const user = users && users[0] || null;

        // add the user to the context.
        return { user: { ...user.dataValues } };
    } catch(err) {
        // in the event where we want all APIs of graphql to be authenticated then uncomment below.
        // throw new AuthenticationError('you must be logged in');
        return { user: null };
    }
};

function createLambdaServer () {
    return new ApolloServerLambda({
        context: getContext,
        typeDefs,
        resolvers,
        dataSources: getDataSources,
        introspection: true,
        playground: true
    });
}

function createLocalServer () {
    return new ApolloServer({
        context: getContext,
        typeDefs,
        resolvers,
        dataSources: getDataSources,
        introspection: true,
        playground: true
    });
}

module.exports = { createLambdaServer, createLocalServer }