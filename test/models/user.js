'use strict';

module.exports = function(bookshelf) {
  var User = bookshelf.Model.extend({
    tableName: 'users',
    resourceName: 'User',

    roles: function() {
      return this.hasMany('Role').through('user_roles');
    }
  });

  return bookshelf.model('User', User);
};
