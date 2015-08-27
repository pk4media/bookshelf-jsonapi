'use strict';

var chainer = require('./chainer');
var jsonapi = require('./jsonapi');
var express = require('express');
var URI = require('URIjs');

function Controller(adapter, options) {
  this.adapter = adapter;
  this.options = options;

  this.canIndex = false;
  this.canCreate = false;
  this.canRead = false;
  this.canUpdate = false;
  this.canDelete = false;

  // Used to store middleware functions for these actions
  this._indexFunctions = [];
  this._createFunctions = [];
  this._readFunctions = [];
  this._updateFunctions = [];
  this._deleteFunctions = [];
}

Controller.prototype.index = function() {
  this.canIndex = true;
  for (var i = 0, len = arguments.length; i < len; i++) {
    this._indexFunctions.push(arguments[i]);
  }
};

Controller.prototype.create = function() {
  this.canCreate = true;
  for (var i = 0, len = arguments.length; i < len; i++) {
    this._createFunctions.push(arguments[i]);
  }
};

Controller.prototype.read = function() {
  this.canRead = true;
  for (var i = 0, len = arguments.length; i < len; i++) {
    this._readFunctions.push(arguments[i]);
  }
};

Controller.prototype.update = function(req, res, next) {
  this.canUpdate = true;
  for (var i = 0, len = arguments.length; i < len; i++) {
    this._updateFunctions.push(arguments[i]);
  }
};

Controller.prototype.delete = function(req, res, next) {
  this.canDelete = true;
  for (var i = 0, len = arguments.length; i < len; i++) {
    this._deleteFunctions.push(arguments[i]);
  }
};

Controller.prototype.getRouter = function() {
  var router = express.Router();
  var controller = this;

  if (this.canIndex) {
    router.route('/').get(function(req, res, next) {
      next();
    });
  }

  if (this.canCreate) {
    router.route('/').post(function(req, res, next) {
      next();
    });
  }

  if (this.canRead) {
    router.route('/:id').get(function(req, res, next) {
      next();
    });
  }

  if (this.canUpdate) {
    router.route('/:id').patch(function(req, res, next) {
      next();
    });
  }

  if (this.canDelete) {
    router.route('/:id').delete(function(req, res, next) {
      next();
    });
  }

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
