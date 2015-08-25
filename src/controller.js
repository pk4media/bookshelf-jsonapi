'use strict';

var chainer = require('./chainer');
var jsonapi = require('./jsonapi');
var express = require('express');

function Controller(model, options) {
  if (options) {
    this.resourceName = options.name || model.prototype.tableName;
  } else {
    this.resourceName = model.prototype.tableName;
  }

  this.model = model;
  this.options = options;
}

function getRouteHandler(controller, name, req, res, next) {
  var tasks = [];

  //Authentication checks if exist
  if (controller.routerOptions && controller.routerOptions.auth[name]) {
    tasks.push(controller.routerOptions.auth[name](controller));
  }

  if (controller.options && controller.options.auth &&
  controller.options.auth[name]) {
    tasks.push(controller.options.auth[name](controller));
  }

  //validation cehcks if exist
  if (controller.routerOptions && controller.routerOptions.validation[name]) {
    tasks.push(controller.routerOptions.validation[name](controller));
  }

  if (controller.options && controller.options.validation &&
  controller.options.validation[name]) {
    tasks.push(controller.options.validation[name](controller));
  }

  tasks.push(controller[name]);

  chainer(controller, req, res, next, tasks);
}

Controller.prototype.index = function(req, res, next) {
  next();
};

Controller.prototype.create = function(req, res, next) {
  next();
};

Controller.prototype.read = function(req, res, next) {
  this.model.where({id : req.params.id}).fetch()
  .bind(this).then(function(data) {
    jsonapi.sendModel(200,  this.resourceName, this.options.relationships,
      data, res);
  });
};

Controller.prototype.update = function(req, res, next) {
  next();
};

Controller.prototype.delete = function(req, res, next) {
  next();
};

Controller.prototype.getRouter = function() {
  var router = express.Router();
  var controller = this;

  router.route('/' + controller.resourceName)
  .get(function(req, res, next) {
    getRouteHandler(controller, 'index', req, res, next);
  })
  .post(function(req, res, next) {
    getRouteHandler(controller, 'create', req, res, next);
  });

  router.route('/' + controller.resourceName + '/:id')
  .get(function(req, res, next) {
    getRouteHandler(controller, 'read', req, res, next);
  })
  .patch(function(req, res, next) {
    getRouteHandler(controller, 'update', req, res, next);
  })
  .delete(function(req, res, next) {
    getRouteHandler(controller, 'delete', req, res, next);
  });

  return router;
};

module.exports = Controller;
