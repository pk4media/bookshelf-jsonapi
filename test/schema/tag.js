'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('tags').then(function() {
    return knex.schema.createTable('tags', function(t) {
      t.increments('id').primary();
      t.string('name', 100);
    });
  });
};
