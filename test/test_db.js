'use strict';

var knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: "./mytestdb" }
});

var bookshelf = require('bookshelf')(knex);

var models = {
  category: require('./models/category')(bookshelf),
  comment: require('./models/comment')(bookshelf),
  post: require('./models/post')(bookshelf),
  role: require('./models/role')(bookshelf),
  tag: require('./models/tag')(bookshelf),
  user: require('./models/user')(bookshelf)
};

module.exports = function() {
  

  return {
    models: models,
    bookshelf: bookshelf
  };
};
