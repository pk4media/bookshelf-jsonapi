'use strict';

var schema = require('../schema');
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
      category: require('../models/category')(bookshelf),
      comment: require('../models/comment')(bookshelf),
      post: require('../models/post')(bookshelf),
      role: require('../models/role')(bookshelf),
      tag: require('../models/tag')(bookshelf),
      user: require('../models/user')(bookshelf)
    };

    return {
      models: models,
      bookshelf: bookshelf
    };
  });
};
