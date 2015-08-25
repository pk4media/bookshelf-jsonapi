'use strict';

module.exports = function(knex) {
  return knex.schema.dropTableIfExists('post_tags').then(function() {
    return knex.schema.createTable('post_tags', function(t) {
      t.integer('post_id').unsigned().references('id').inTable('posts');
      t.integer('tag_id').unsigned().references('id').inTable('tags');
    });
  });
};
