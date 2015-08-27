'use strict';

var schema = require('./schema');
var Knex = require('knex');
var Bookshelf = require('bookshelf');

module.exports = function(filename) {
  var knex = new Knex({
    client: 'sqlite3',
    connection: { filename: './' + filename + '.db3' }
  });

  //Drop and create tables will clear all data
  return schema(knex).then(function() {
    var bookshelf = new Bookshelf(knex);
    bookshelf.plugin('registry');

    var models = {
      category: require('../bookshelf/models/category')(bookshelf),
      comment: require('../bookshelf/models/comment')(bookshelf),
      post: require('../bookshelf/models/post')(bookshelf),
      role: require('../bookshelf/models/role')(bookshelf),
      tag: require('../bookshelf/models/tag')(bookshelf),
      user: require('../bookshelf/models/user')(bookshelf)
    };

    return {
      models: models,
      bookshelf: bookshelf
    };
  });
};
