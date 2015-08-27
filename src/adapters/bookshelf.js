'use strict';

var _ = require('lodash');

function Adapter(model, options) {
  this.model = model;
  this.options = _.assign({}, {
    type: model.tableName,
    name: model.tableName,
    relationships: []
  }, options);

  if (!this.options.baseUrl) {
    this.options.baseUrl = '/' + this.options.name;
  }

  this.filters = {};
}

function getPreFetch(options, includes) {
  var withRelated = [];

  options.relationships.forEach(function(relationship) {
    if (relationship.prefetch) {
      withRelated.push(relationship.name);
    }
  });

  if (includes) {
    includes.forEach(function(include) {
      options.relationships.forEach(function(relationship) {
        if (relationship.name === include && !relationship.prefetch) {
          withRelated.push(relationship.name);
        }
      });
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
}

Adapter.prototype.addFilter = function(name, fn) {
  if(name in this.filters) {
    throw new Error('Can not add a filter with the same name.');
  }
  this.filters[name] = fn;
};

Adapter.prototype.getById = function(id, fields, includes, filters, cb) {
  try {
    var fetchModel = this.model.where({id : id});

    if (filters) {
      filters.forEach(function(filter) {
        if (this.filters[filter.name]) {
          this.filters[filter.name].call(this, fetchModel, filter);
        }
      });
    }

    return fetchModel.fetch({withRelated: getPreFetch(this.options, includes)})
    .bind(this).then(function(data) {
      this.toJsonApi(data, fields, includes, filters, function(err, data) {
        cb(err, data);
      });
    })
    .catch(function(err) {
      cb(err);
    });
  } catch(ex) {
    cb(ex);
  }
};

Adapter.prototype.toJsonApi = function(model, fields, includes, filters, cb) {
  try {
    var sendAttributes = model.attributes;
    delete sendAttributes.id;
    var self = this;

    var sendRelationships = [];
    this.options.relationships.forEach(function(relationship) {
      var related = model.related(relationship.name);
      var relatedData = related.relatedData;
      var addingRelationship;

      if (relatedData) {
        if (relatedData.type === 'belongsTo') {
          addingRelationship = {
            name: relationship.name,
            value: {
              links: {
                self: urlMerge(self.options.baseUrl, model.id,
                  relationship.name),
                related: urlMerge(self.options.baseUrl, model.id,
                  relationship.name)
              },
              data: {
                type: relationship.type,
                id: sendAttributes[model.related(relationship.name)
                  .relatedData.foreignKey].toString()
              }
            }
          };
          sendRelationships.push(addingRelationship);
          delete sendAttributes[model.related(relationship.name)
            .relatedData.foreignKey];
        }
        if (relatedData.type === 'hasMany' ||
        relatedData.type === 'belongsToMany') {
          addingRelationship = {
            name: relationship.name,
            value: {
              links: {
                self: urlMerge(self.options.baseUrl, model.id,
                  relationship.name),
                related: urlMerge(self.options.baseUrl, model.id,
                  relationship.name)
              }
            }
          };

          if (relationship.prefetch || related.length) {
            addingRelationship.value.data = model.related(relationship.name)
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
      data: {
        type: self.options.name,
        id: model.id.toString(),
        attributes: sendAttributes
      }
    };

    if (sendRelationships.length > 0) {
      sendData.data.relationships = {};
      sendRelationships.forEach(function(relationship) {
        sendData.data.relationships[relationship.name] = relationship.value;
      });
    }

    if (includes) {
      var sendIncluded = [];
      includes.forEach(function(include) {
        self.options.relationships.forEach(function(relationship) {
          if (relationship.name === include) {
            model.related(relationship.name).forEach(function(relationshipModel) {
              sendIncluded.push({
                type: relationship.type,
                id: relationshipModel.id.toString(),
                attributes: {}
              });
            });
          }
        });
      });
      sendData.included = sendIncluded;
    }

    cb(null, sendData);
  } catch(ex) {
    cb(ex);
  }
};

module.exports = Adapter;
