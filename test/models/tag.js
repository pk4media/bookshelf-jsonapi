'use strict';

module.exports = function(bookshelf) {
  var Tag = bookshelf.Model.extend({
    tableName: 'tags',
    resourceName: 'Tag',

    posts: function() {
      return this.belongsToMany('Post', 'post_tags');
    }
  });

  return bookshelf.model('Tag', Tag);
};
