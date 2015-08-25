'use strict';

var Faker = require('faker');

module.exports = function(factory, models) {
  var attributes = {
    name: function() {
      return Faker.lorem.words(1);
    }
  };

  factory.define('tag', models.role, attributes);
};
