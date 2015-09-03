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

function getPreFetch(includes, rootName, options) {
  var checkedPreFetch = {};

  // Get prefetch items for root
  checkedPreFetch[rootName] =  true;
  var withRelated = getPreFetchRelationships(rootName, options);

  if (includes) {
    //Loop over includes and make sure they are valid relationships. This builds
    //the withRelated array using unions and also includes prefetch relationships
    //for all models we are including
    includes.forEach(function(include) {
      if (include.indexOf('.') < 0) {
        if (options.models[rootName].relationships[include]) {
          // Add include, if not already in, as it is valid
          withRelated =_.union(withRelated, [include]);
        } else {
          throw new Error('Could not find relationship \'' + include + '\' in \'' +
          rootName + '\' model.');
        }
      } else {
        //reduct over relationships getting the model factory
        var modelName = rootName;
        include.split('.').forEach(function(relationshipName) {
          var factory = options.models[modelName];

          if (factory.relationships[relationshipName]) {
            if (!checkedPreFetch[modelName]) {
              //Add any prefetch relationships
              checkedPreFetch[modelName] = true;
              withRelated = _.union(withRelated,
                getPreFetchRelationships(modelName, options));
            }
            modelName = factory.relationships[relationshipName].name;
          } else {
            throw new Error('Could not find relationship \'' + relationshipName +
            '\' in \'' + factory.name + '\' model for include \'' + include + '\'.');
          }
        });


        // Add include, if not already in, as it is valid
        withRelated =_.union(withRelated, [include]);
      }
    });
  }

  return withRelated;
}

function getPreFetchRelationships(name, options) {
  var factory = options.models[name];
  var values = Object.keys(factory.relationships).filter(function(key) {
    return factory.relationships[key].prefetch;
  });
  return values;
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

    var withRelated = getPreFetch(includes, name, this.options);
    return fetchModel.fetch({withRelated: withRelated})
    .bind(this).then(function(data) {
      try {
        var sendJson = this.toJsonApi(name, data, fields, includes);
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

Adapter.prototype.toJsonApi = function(name, model, fields, includes) {
  var self = this;
  var sendData = {
    data: this.modelToJsonApi(name, model, fields)
  };

  if (includes) {
    sendData.included = getAllIncludeModels(name, model, includes, this.options)
    .map(function(value) {
      return self.modelToJsonApi(value.name, value.model, fields);
    });
  }

  return sendData;
};

function getAllIncludeModels(name, model, includes, options) {
  var allIncludeAsTree = includes.map(function(include) {
    return getAllIncludesRecursively(name, model, include, options);
  });

  return _.uniq(_.flattenDeep(allIncludeAsTree), false, function(value) {
    return value.type + '-' + value.model.id; //join to make type-id unique
  });
}

function getAllIncludesRecursively(name, model, include, options) {
  var relationshipName, relationshipType;

  if (include.indexOf('.') >= 0) {
    var includeTree = include.split('.');
    relationshipName = options.models[name].relationships[includeTree[0]].name;
    relationshipType = options.models[name].relationships[includeTree[0]].type;

    var values = getModelsFromRelationship(model, includeTree[0],
      relationshipName, relationshipType);

    return [
      values,
      values.map(function(value) {
        return getAllIncludesRecursively(value.name, value.model,
          _.rest(includeTree).join('.'), options)
      })
    ]
  } else {
    relationshipName = options.models[name].relationships[include].name;
    relationshipType = options.models[name].relationships[include].type;
    return getModelsFromRelationship(model, include, relationshipName, relationshipType);
  }
}

function getModelsFromRelationship(model, relationship, relationshipName, relationshipType) {
  var relationshipData = model.related(relationship);
  if (relationshipData && relationshipData.length) { //collection
    return relationshipData.toArray().map(function(relationshipModel) {
      return {
        name: relationshipName,
        type: relationshipType,
        model: relationshipModel
      }
    });
  } else { // Single model
    return [
      {
        name: relationshipName,
        type: relationshipType,
        model: relationshipData
      }
    ]
  }
}

Adapter.prototype.modelToJsonApi = function(name, model, fields) {
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
