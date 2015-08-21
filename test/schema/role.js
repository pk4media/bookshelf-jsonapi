'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('roles').then(function() {
    return knex.schema.createTable('roles', function(t) {
      t.increments('id').primary();
      t.string('name', 100);
    });
  });
};
