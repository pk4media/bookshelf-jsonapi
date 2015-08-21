'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('posts').then(function() {
    return knex.schema.createTable('posts', function(t) {
      t.increments('id').primary();
      t.integer('category_id').unsigned().inTable('categories').references('id');
      t.integer('author_id').unsigned().inTable('users').references('id');
      t.text('post_text');
      t.dateTime('post_date').defaultTo(knex.raw("date('now')"));
    });
  });
};
