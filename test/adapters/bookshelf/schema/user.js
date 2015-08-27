'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('users').then(function() {
    return knex.schema.createTable('users', function(t) {
      t.increments('id').primary();
      t.string('first_name', 100);
      t.string('last_name', 100);
      t.string('email', 255);
      t.string('password', 100);
    });
  });
};
