'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('roles').then(function() {
    knex.schema.createTable('roles', function(t) {
      t.increments('id').primary();
      t.string('name', 100);
    });
  });
};
