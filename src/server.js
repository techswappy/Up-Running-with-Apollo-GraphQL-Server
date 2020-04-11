const { ApolloServer } = require('apollo-server');
const { ApolloServerLambda } = require('apollo-server-lambda');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');

const isEmail = require('isemail');

function createLambdaServer (store) {
    return new ApolloServerLambda({
        context: getContext,
        typeDefs,
        resolvers,
        dataSources: () => ({
            launchAPI: new LaunchAPI(),
            userAPI: new UserAPI({ store })
        }),
        introspection: true,
        playground: true
    });
}

function createLocalServer (store) {
    return new ApolloServer({
        context: getContext,
        typeDefs,
        resolvers,
        dataSources: () => ({
            launchAPI: new LaunchAPI(),
            userAPI: new UserAPI({ store })
        }),
        introspection: true,
        playground: true
    });
}

const getContext = async ({ req }) => {
    // simple auth check on every request
    const auth = req.headers && req.headers.authorization || '';
    const email = Buffer.from(auth, 'base64').toString('ascii');

    if (!isEmail.validate(email)) return { user: null };

    // find a user by their email
    const users = await store.users.findOrCreate({ where: { email } });
    const user = users && users[0] || null;

    return { user: { ...user.dataValues } };
};

module.exports = { createLambdaServer, createLocalServer }