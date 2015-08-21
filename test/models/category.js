'use strict';

module.exports = function(bookshelf) {
  var Category = bookshelf.Model.extend({
    tableName: 'categories',
    resourceName: 'Category',

    posts: function() {
      return this.hasMany('Post');
    }
  });

  return bookshelf.model('Category', Category);
};
