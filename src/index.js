const { createLocalServer } = require("./server");
const { createStore } = require('./utils');

const store = createStore();

const server = createLocalServer(store);

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});