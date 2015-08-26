'use strict';

var chainer = require('./chainer');
var jsonapi = require('./jsonapi');
var express = require('express');
var URI = require('URIjs');

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

function getPreFetch(options, includes) {
  var withRelated = [];

  if (options && options.relationships) {
    options.relationships.forEach(function(relationship) {
      if (relationship.prefetch) {
        withRelated.push(relationship.name);
      }
    });
  }

  if (includes) {
    includes.split(',').forEach(function(include) {
      options.relationships.forEach(function(relationship) {
        if (relationship.name === include && !relationship.prefetch) {
          withRelated.push(relationship.name);
        }
      });
    });
  }
  return withRelated;
}

Controller.prototype.index = function(req, res, next) {
  next();
};

Controller.prototype.create = function(req, res, next) {
  next();
};

Controller.prototype.read = function(req, res, next) {
  this.model.where({id : req.params.id}).fetch({
    withRelated: getPreFetch(this.options, req.query.includes)
  }).bind(this).then(function(data) {
    jsonapi.sendModel(200, this, data, res, req.query.includes);
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

Controller.prototype.getSelfRelationshipLink = function(parentId, relationshipName) {
  var url = '/';
  if (this.options && this.options.rootUrl) {
    url = this.options.rootUrl + '/';
  }

  url += this.resourceName + '/' + parentId + '/relationships/' + relationshipName;
  return url;
};

Controller.prototype.getRelatedRelationshipLink = function(parentId, relationshipName) {
  var url = '/';
  if (this.options && this.options.rootUrl) {
    url = this.options.rootUrl + '/';
  }

  url += this.resourceName + '/' + parentId + '/' + relationshipName;
  return url;
};

module.exports = Controller;
