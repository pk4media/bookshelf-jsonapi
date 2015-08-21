'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('categories').then(function() {
    return knex.schema.createTable('categories', function(t) {
      t.increments('id').primary();
      t.string('name', 100);
    });
  });
};
