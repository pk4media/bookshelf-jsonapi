'use strict';

var Faker = require('faker');

module.exports = function(factory, models) {
  var attributes = {
    name: function() {
      return Faker.internet.domainWord();
    }
  };

  factory.define('role', models.role, attributes);
};
