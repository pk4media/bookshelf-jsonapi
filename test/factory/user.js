'use strict';

var Faker = require('faker');

module.exports = function(factory, models) {
  var attributes = {
    first_name: function() {
      return Faker.name.firstName();
    },

    last_name: function() {
      return Faker.name.lastName();
    },

    email: function() {
      return Faker.internet.email();
    },

    password: 'password'
  };

  factory.define('user', models.user, attributes);
};
