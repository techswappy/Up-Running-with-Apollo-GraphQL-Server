const { ApolloServer } = require('apollo-server');
const { ApolloServerLambda } = require('apollo-server-lambda');
const isEmail = require('isemail');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');
const { createStore } = require('./store');

const store = createStore();

const getDataSources = () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store })
});

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