'use strict';
var fs = require('fs');
var BPromise = require('bluebird');

module.exports = function(knex) {
  return BPromise.all([
    require('./user')(knex),
    require('./role')(knex),
    require('./tag')(knex),
    require('./category')(knex)
  ]).then(function() {
    return BPromise.all([
      require('./user_role')(knex),
      require('./post')(knex)
    ]);
  }).then(function() {
    return BPromise.all([
      require('./comment')(knex),
      require('./post_tag')(knex)
    ]);
  });
};
