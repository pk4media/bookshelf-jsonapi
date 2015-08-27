'use strict';

var Faker = require('faker');

module.exports = function(factory, models) {
  var attributes = {
    category_id: factory.assoc('category', 'id'),
    author_id: factory.assoc('user', 'id'),

    post_text: function() {
      return Faker.lorem.paragraphs(5);
    }
  };

  factory.define('post', models.post, attributes);
};
