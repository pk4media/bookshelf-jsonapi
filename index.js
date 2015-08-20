'use strict';

var Router = require('./src/router');
var Controller = require('./src/controller');

var JsonApiBookshelf = {
  Router: Router,
  Controller: Controller
}

module.exports = JsonApiBookshelf;
