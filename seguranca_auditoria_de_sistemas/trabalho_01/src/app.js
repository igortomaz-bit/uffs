const express = require('express');
const routes = require('./routes');

class App {
  server;

  constructor() {
    this.server = express();
    this.middlewares();
    this.routes()
  }

  routes() {
    this.server.use(routes)
  }

  middlewares() {
    this.server.use(express.json());
  }
}

module.exports = new App().server