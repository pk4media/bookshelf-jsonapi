'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('posts').then(function() {
    return knex.schema.createTable('posts', function(t) {
      t.increments('id').primary();
      t.integer('category_id').unsigned().references('id').inTable('categories');
      t.integer('author_id').unsigned().references('id').inTable('users');
      t.text('post_text');
      t.dateTime('post_date').defaultTo(knex.raw("(DATETIME('now'))"));
    });
  });
};
