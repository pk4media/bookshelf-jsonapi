'use strict';

module.exports = {

  sendModel: function(statusCode, controller, model, res, includes) {
    var sendAttributes = model.attributes;
    delete sendAttributes.id;

    var sendRelationships = [];
    controller.options.relationships.forEach(function(relationship) {
      var related = model.related(relationship.name);
      var relatedData = related.relatedData;
      var addingRelationship;

      if (relatedData) {
        if (relatedData.type === 'belongsTo') {
          addingRelationship = {
            name: relationship.name,
            value: {
              links: {
                self: controller.getSelfRelationshipLink(model.id,
                  relationship.name),
                related: controller.getRelatedRelationshipLink(model.id,
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
                self: controller.getSelfRelationshipLink(model.id,
                  relationship.name),
                related: controller.getRelatedRelationshipLink(model.id,
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
        type: controller.resourceName,
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
      includes.split(',').forEach(function(include) {
        controller.options.relationships.forEach(function(relationship) {
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

    return res.status(statusCode).json(sendData);
  },

  sendError: function (statusCode, error, res) {
    return res.status(statusCode).json({ errors: [error] });
  },

  sendErrors: function (statusCode, errors, res) {
    return res.status(statusCode).json({ errors: errors });
  }

};
