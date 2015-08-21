'use strict';

module.exports = function(bookshelf) {
  var User = bookshelf.Model.extend({
    tableName: 'users',
    resourceName: 'User',

    roles: function() {
      return this.belongsToMany('Role', 'user_roles');
    },

    posts: function() {
      return this.hasMany('Post');
    },

    comments: function() {
      return this.hasMany('Comment');
    }
  });

  return bookshelf.model('User', User);
};
