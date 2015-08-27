'use strict';

var Faker = require('faker');

module.exports = function(factory, models) {
  var attributes = {
    post_id: factory.assoc('post', 'id'),
    author_id: factory.assoc('user', 'id'),

    reply_comment_id: null,

    text: function() {
      return Faker.lorem.paragraph();
    }
  };

  factory.define('comment', models.comment, attributes);
};
