'use strict';

var _ = require('lodash');

function getModelPrefetches(model, baseName) {
  var prefetches = [];
  if (model && model.relationships) {
    prefetches = Object.keys(model.relationships)
    .filter(function(key) {
      return model.relationships[key].prefetch;
    }).map(function(key) {
      if (baseName) {
        return {
          fullname: baseName + '.' + key,
          name: key
        };
      } else {
        return {
          fullname: key,
          name: key
        };
      }
    });
  }
  return prefetches || [];
}

function addModelRelationship(values, modelName, relationshipName) {
  if (!values.models[modelName]) {
    values.models[modelName] = {};
  }
  if (!values.models[modelName][relationshipName]) {
    values.models[modelName][relationshipName] = true;
  }
  return values;
}

function addIncludes(name, baseModel, values, includes, options) {
  if (includes) {
    includes.forEach(function(include) {
      values = addInclude(name, baseModel, values, include, options);
    });
  }
  return values;
}

function addPrefetch(values, prefetch) {
  values.withRelated = _.uniq(_.union(values.withRelated, [prefetch]));
  return values;
}

function addPrefetches(values, name, prefetches) {
  prefetches.forEach(function(prefetch) {
    values = addModelRelationship(values, name, prefetch.name);
    values = addPrefetch(values, prefetch.fullname);
  });
  return values;
}

function addInclude(name, baseModel, values, include, options) {
  if (include) {
    var currentInclude = '';
    var currentModelName = name;
    var currentModel = baseModel;
    include.split('.').forEach(function(subInclude) {
      values = addModelRelationship(values, currentModelName, subInclude);
      currentInclude += subInclude;

      values.includes = _.uniq(_.union(values.includes, [currentInclude]));
      values = addPrefetch(values, currentInclude);

      currentModelName = currentModel.relationships[subInclude].name;
      currentModel = options.models[currentModelName];
      values = addPrefetches(values, currentModelName,
        getModelPrefetches(currentModel, currentInclude));
      currentInclude += '.';

    });
  }
  return values;
}

module.exports = function(name, includes, options) {
  var baseModel = options.models[name];
  var startValues = {
    withRelated: [],
    includes: [],
    models: {}
  };
  startValues = addPrefetches(startValues, name, getModelPrefetches(baseModel));
  return addIncludes(name, baseModel, startValues, includes, options);
};
