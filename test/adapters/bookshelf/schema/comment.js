'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('comments').then(function() {
    return knex.schema.createTable('comments', function(t) {
      t.increments('id').primary();
      t.integer('post_id').unsigned().references('id').inTable('posts');
      t.integer('author_id').unsigned().references('id').inTable('users');
      t.integer('reply_comment_id').unsigned().references('id').inTable('comments');
      t.text('text');
      t.dateTime('comment_date').defaultTo(knex.raw("(DATETIME('now'))"));
    });
  });
};
