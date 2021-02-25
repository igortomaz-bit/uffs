const express = require('express')
const sessionController = require('../controllers/session');

class Routes {
  routes;

  constructor() {
    this.routes = express.Router();
    this.addSessionsRoute();
  }

  addSessionsRoute() {
    this.routes.post('/sessions', sessionController.index)
  }
}

module.exports = new Routes().routes;