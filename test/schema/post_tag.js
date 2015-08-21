'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('post_tags').then(function() {
    return knex.schema.createTable('post_tags', function(t) {
      t.integer('post_id').unsigned().inTable('posts').references('id');
      t.integer('tag_id').unsigned().inTable('tags').references('id');
    });
  });
};
