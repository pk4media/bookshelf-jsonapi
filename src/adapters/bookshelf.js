'use strict';

var _ = require('lodash');

function Adapter(model, options) {
  this.model = model;
  this.options = _.assign({}, {
    name: model.tableName,
    relationships: []
  }, options);
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

Adapter.prototype.getById = function(id, includes, filters, cb) {
  var fetchModel = controller.model.where({id : id});
  //Add filters here
  return fetchModel.fetch({withRelated: getPreFetch(this.options, includes)})
  .then(function(data) {
    cb(null, data);
  })
  .catch(function(err) {
    cb(err);
  });
}

module.exports = Adapter;
