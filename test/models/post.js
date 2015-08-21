'use strict';

module.exports = function(bookshelf) {
  var Post = bookshelf.Model.extend({
    tableName: 'posts',
    resourceName: 'Post',

    author: function() {
      return this.belongsTo('User', 'author_id');
    },

    category: function() {
      return this.belongsTo('Category', 'category_id');
    },

    tags: function() {
      return this.hasMany('Tag');
    },

    comments: function() {
      return this.hasMany('Comment');
    }
  });

  return bookshelf.model('Post', Post);
};
