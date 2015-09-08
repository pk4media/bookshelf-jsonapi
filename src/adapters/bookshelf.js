'use strict';

var _ = require('lodash');
var Include = require('./include');

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

Adapter.prototype.getRelationshipById = function(name, id, relationshipName, cb) {
  try {
    var rootFactory = this.options.models[name];
    if (!rootFactory) return cb(null, null);

    var relationship = rootFactory.relationships[relationshipName];
    if (!relationship) return cb(null, null);

    var relatedData = rootFactory.related(relationshipName).relatedData;

    var withRelated = [];
    //include relationship in not one to many
    if (relatedData.type !== 'belongsTo') {
      withRelated = [relationshipName];
    }

    rootFactory.model.where({id : id}).fetch({withRelated: withRelated})
    .bind(this).then(function(data) {
      cb(null, getRelationshipFromModel(name, data, relationshipName,
        relationship.type, relatedData, this.options, {
          withRelated: withRelated,
          includes: withRelated
        }));
    });
  } catch(ex) {
    cb(ex);
  }
};

function getRelationshipFromModel(name, model, relationshipName, relationshipType,
  relatedData, options, includes) {
  if (!model) return null;

  if (relatedData.type === 'belongsTo') {
    var foreignKey = relatedData.foreignKey;
    var output = {
      links: {
        self: urlMerge(options.baseUrl, name, model.id, 'relationships',
          relationshipName),
        related: urlMerge(options.baseUrl, name, model.id, relationshipName)
      }
    };

    if (model.get(foreignKey)) {
      output.data = {
        type: relationshipType,
        id: model.get(foreignKey).toString()
      };
    } else {
      output.data = null;
    }

    return output;
  }

  if (relatedData.type === 'hasMany' || relatedData.type === 'belongsToMany') {
    var returnData = {
      links: {
        self: urlMerge(options.baseUrl, name, model.id, 'relationships',
          relationshipName),
        related: urlMerge(options.baseUrl, name, model.id, relationshipName)
      }
    };

    if (includes.models[name][relationshipName]) {
      returnData.data = model.related(relationshipName).toArray().map(function(item) {
        return {
          type: relationshipType,
          id: item.id.toString()
        };
      });
    }
    return returnData;
  }
}

Adapter.prototype.getById = function(name, id, fields, includes, filters, cb) {
  try {
    var factory = this.options.models[name];
    var fetchModel = factory.model.where({id : id});
    var allIncludes = new Include(name, includes || [], this.options);

    if (filters) {
      filters.forEach(function(filter) {
        if (this.filters[filter.name]) {
          this.filters[filter.name].call(this, fetchModel, filter);
        }
      });
    }

    return fetchModel.fetch({withRelated: allIncludes.withRelated})
    .bind(this).then(function(data) {
      try {
        if (!data) return cb(null, null);
        var sendJson = this.toJsonApi(name, data, fields, allIncludes);
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
    data: this.modelToJsonApi(name, model, fields, includes)
  };

  if (includes) {
    sendData.included = getAllIncludeModels(name, model, includes, this.options)
    .map(function(value) {
      return self.modelToJsonApi(value.name, value.model, fields,
        includes);
    });
  }

  return sendData;
};

function getAllIncludeModels(name, model, includes, options) {
  var allIncludeAsTree = includes.includes.map(function(include) {
    return getAllIncludesRecursively(name, model, include, options);
  });

  return _.uniq(_.flattenDeep(allIncludeAsTree), false, function(value) {
    return value.type + '-' + value.model.id; //join to make type-id unique
  }).filter(function(include) {
    return include.model.id;
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
          _.rest(includeTree).join('.'), options);
      })
    ];
  } else {
    relationshipName = options.models[name].relationships[include].name;
    relationshipType = options.models[name].relationships[include].type;
    return getModelsFromRelationship(model, include, relationshipName,
      relationshipType);
  }
}

function getModelsFromRelationship(model, relationship, relationshipName,
relationshipType) {
  var relationshipData = model.related(relationship);
  if (relationshipData && relationshipData.length) { //collection
    return relationshipData.toArray().map(function(relationshipModel) {
      return {
        name: relationshipName,
        type: relationshipType,
        model: relationshipModel
      };
    });
  } else { // Single model
    return [
      {
        name: relationshipName,
        type: relationshipType,
        model: relationshipData
      }
    ];
  }
}

Adapter.prototype.modelToJsonApi = function(name, model, fields, includes) {
  if (!this.options.models[name]) {
    throw new Error('Adapter is missing model ' + name + '.');
  }

  var sendAttributes = model.attributes;
  delete sendAttributes.id;
  var self = this;

  var sendRelationships = [];
  if (this.options.models[name].relationships) {
    Object.keys(this.options.models[name].relationships).forEach(function(key) {
      var relationship = self.options.models[name].relationships[key];
      var related = model.related(key);
      var relatedData = related.relatedData;

      if (relatedData) {
        var addingRelationship = getRelationshipFromModel(name, model, key,
          relationship.type, relatedData, self.options, includes);

        if (addingRelationship) {
          sendRelationships.push({
            name: key,
            value: addingRelationship
          });
        }

        if (relatedData.type === 'belongsTo') {
          delete sendAttributes[model.related(key).relatedData.foreignKey];
        }
      }
    });
  }

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
