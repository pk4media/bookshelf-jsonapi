'use strict';

var express = require('express');

var Router = function(controllers, options) {
  var router = express.Router();
  var i;

  for (i = 0; i < controllers.length; i++) {
    controllers[i].routerOptions = options;
    controllers[i].addRoutes(router, options);
  }

  return router;
};

module.exports = Router;
