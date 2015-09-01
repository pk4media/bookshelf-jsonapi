'use strict';

module.exports = function(bookshelf) {
  var Comment = bookshelf.Model.extend({
    tableName: 'comments',
    resourceName: 'Comment',

    post: function() {
      return this.belongsTo('Post', 'post_id');
    },

    author: function() {
      return this.belongsTo('User', 'author_id');
    },

    reply_comment: function() {
      return this.belongsTo('Comment', 'reply_comment_id');
    }
  });

  return bookshelf.model('Comment', Comment);
};
