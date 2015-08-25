'use strict';

module.exports = {

  sendModel: function(statusCode, type, relationships, model, res) {
    var sendAttributes = model.attributes;
    delete sendAttributes.id;

    var sendRelationships = [];
    relationships.forEach(function(relationship) {
      console.log(model.related(relationship).relatedData);
      delete sendAttributes[model.related(relationship).relatedData.foreignKey]
    });

    return res.status(statusCode).json({
      data: {
        type: type,
        id: model.id,
        attributes: sendAttributes
      }
    });
  },

  sendError: function (statusCode, error, res) {
    return res.status(statusCode).json({ errors: [error] });
  },

  sendErrors: function (statusCode, errors, res) {
    return res.status(statusCode).json({ errors: errors });
  }

};
