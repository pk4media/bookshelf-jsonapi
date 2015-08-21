'use strict';

module.exports = function(bookshelf) {
  var Tag = bookshelf.Model.extend({
    tableName: 'tags',
    resourceName: 'Tag',

    posts: function() {
      return this.hasMany('Post');
    }
  });

  return bookshelf.model('Tag', Tag);
};
