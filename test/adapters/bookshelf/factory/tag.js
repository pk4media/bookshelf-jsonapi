'use strict';

var Faker = require('faker');

module.exports = function(factory, models) {
  var attributes = {
    name: function() {
      return Faker.company.catchPhrase();
    }
  };

  factory.define('tag', models.tag, attributes);
};
