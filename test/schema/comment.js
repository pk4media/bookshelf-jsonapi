'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('comments').then(function() {
    knex.schema.createTable('comments', function(t) {
      t.increments('id').primary();
      t.integer('post_id').unsigned().inTable('posts').references('id');
      t.integer('author_id').unsigned().inTable('users').references('id');
      t.integer('reply_comment_id').unsigned().inTable('comments').references('id');
      t.text('text');
      t.dateTime('comment_date').defaultTo(knex.raw("date('now')"));
    });
  });
};
