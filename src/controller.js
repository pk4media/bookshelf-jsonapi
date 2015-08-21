'use strict';

var chainer = require('./chainer');
var jsonapi = require('./jsonapi');
var express = require('express');

var Controller = function(model, options) {
  if (options) {
    this.resourceName = options.name || model.prototype.tableName;
  } else {
    this.resourceName = model.prototype.tableName;
  }

  this.model = model;
  this.options = options;
};

Controller.prototype.getRouter = function() {
  var router = express.Router();

  router.route('/' + this.resourceName)
  .get(function(req, res, next) {
    this.getRouteHandler('index', req, res, next);
  })
  .post(function(req, res, next) {
    this.getRouteHandler('create', req, res, next);
  });

  router.route('/' + this.resourceName + '/:id')
  .get(function(req, res, next) {
    this.getRouteHandler('read', req, res, next);
  })
  .patch(function(req, res, next) {
    this.getRouteHandler('update', req, res, next);
  })
  .delete(function(req, res, next) {
    this.getRouteHandler('delete', req, res, next);
  });

  return router;
};

Controller.prototype.getRouteHandler = function(name, req, res, next) {
  var tasks = [];

  //Authentication checks if exist
  if (this.routerOptions.auth[name]) {
    tasks.push(this.routerOptions.auth[name](this));
  }

  if (this.options.auth[name]) {
    tasks.push(this.options.auth[name](this));
  }

  //validation cehcks if exist
  if (this.routerOptions.validation[name]) {
    tasks.push(this.routerOptions.validation[name](this));
  }

  if (this.options.validation[name]) {
    tasks.push(this.options.validation[name](this));
  }

  tasks.push(this[name]);

  chainer(req, res, next, tasks);
};

Controller.prototype.index = function(req, res, next) {
  next();
};

Controller.prototype.create = function(req, res, next) {
  next();
};

Controller.prototype.read = function(req, res, next) {
  next();
};

Controller.prototype.update = function(req, res, next) {
  next();
};

Controller.prototype.delete = function(req, res, next) {
  next();
};

module.exports = Controller;
