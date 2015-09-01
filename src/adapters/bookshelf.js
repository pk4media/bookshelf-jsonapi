'use strict';

var _ = require('lodash');

function Adapter(options) {
  this.options = options;

  if (!this.options.baseUrl) {
    this.options.baseUrl = '';
  }

  if (!this.options.models || Object.keys(this.options.models).length <= 0) {
    throw new Error('Options must contain a models object with at least one model.');
  }

  this.filters = {};
}

function getPreFetch(factory, includes) {
  var withRelated = [];

  Object.keys(factory.relationships).forEach(function(key) {
    if (factory.relationships[key].prefetch) {
      withRelated.push(key);
    }
  });

  if (includes) {
    includes.forEach(function(include) {
      if (factory.relationships[include]) {
        withRelated.push(include);
      }
    });
  }

  return withRelated;
}

function urlMerge() {
  var url = '';
  for (var i = 0, len = arguments.length; i < len; i++) {
    url += arguments[i];
    if (i < len -1) {
      url += '/';
    }
  }
  return url;
}

Adapter.prototype.addFilter = function(name, fn) {
  if(name in this.filters) {
    throw new Error('Can not add a filter with the same name.');
  }
  this.filters[name] = fn;
};

Adapter.prototype.getById = function(name, id, fields, includes, filters, cb) {
  try {
    var factory = this.options.models[name];
    var fetchModel = factory.model.where({id : id});

    if (filters) {
      filters.forEach(function(filter) {
        if (this.filters[filter.name]) {
          this.filters[filter.name].call(this, fetchModel, filter);
        }
      });
    }

    return fetchModel.fetch({withRelated: getPreFetch(factory, includes)})
    .bind(this).then(function(data) {
      try {
        var sendJson = this.toJsonApi(name, data, fields, includes, filters);
        cb(null, sendJson);
      } catch(ex) {
        cb(ex);
      }
    })
    .catch(function(err) {
      cb(err);
    });
  } catch(ex) {
    cb(ex);
  }
};

Adapter.prototype.toJsonApi = function(name, model, fields, includes, filters) {
  var sendData = {
    data: this.modelToJsonApi(name, model, fields, includes, filters)
  };

  if (includes) {
    var self = this;
    var sendIncluded = [];
    includes.forEach(function(include) {
      Object.keys(self.options.models[name].relationships).forEach(function(key) {
        var relationship =  self.options.models[name].relationships[key];
        if (key === include) {
          model.related(key).forEach(function(relationshipModel) {
            sendIncluded.push(self.modelToJsonApi(relationship.name,
            relationshipModel, null, null, null));
          });
        }
      });
    });
    sendData.included = sendIncluded;
  }

  return sendData;
};

Adapter.prototype.modelToJsonApi = function(name, model, fields, includes, filters) {
  var sendAttributes = model.attributes;
  delete sendAttributes.id;
  var self = this;

  var sendRelationships = [];
  Object.keys(this.options.models[name].relationships).forEach(function(key) {
    var relationship = self.options.models[name].relationships[key];
    var related = model.related(key);
    var relatedData = related.relatedData;
    var addingRelationship;

    if (relatedData) {
      if (relatedData.type === 'belongsTo') {
        var idAttribute = sendAttributes[model.related(key).relatedData.foreignKey];
        addingRelationship = {
          name: key,
          value: {
            links: {
              self: urlMerge(self.options.baseUrl, name, model.id,
                'relationships', key),
              related: urlMerge(self.options.baseUrl, name, model.id, key)
            }
          }
        };

        if (idAttribute) {
          addingRelationship.value.data = {
            type: relationship.type,
            id: idAttribute.toString()
          };
        } else {
          addingRelationship.value.data = null;
        }

        sendRelationships.push(addingRelationship);
        delete sendAttributes[model.related(key)
          .relatedData.foreignKey];
      }
      if (relatedData.type === 'hasMany' ||
      relatedData.type === 'belongsToMany') {
        addingRelationship = {
          name: key,
          value: {
            links: {
              self: urlMerge(self.options.baseUrl, name, model.id,
                'relationships', key),
              related: urlMerge(self.options.baseUrl, name, model.id, key)
            }
          }
        };

        if (relationship.prefetch || related.length) {
          addingRelationship.value.data = model.related(key)
          .map(function(childModel) {
            return {
              type: relationship.type,
              id: childModel.id.toString()
            };
          });
        }

        sendRelationships.push(addingRelationship);
      }
    }
  });

  var sendData = {
    type: this.options.models[name].type,
    id: model.id.toString(),
    attributes: sendAttributes
  };

  if (sendRelationships.length > 0) {
    sendData.relationships = {};
    sendRelationships.forEach(function(relationship) {
      sendData.relationships[relationship.name] = relationship.value;
    });
  }

  return sendData;
};

module.exports = Adapter;
