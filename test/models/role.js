'use strict';

module.exports = function(bookshelf) {
  var Role = bookshelf.Model.extend({
    tableName: 'roles',
    resourceName: 'Role',

    users: function() {
      return this.hasMany('User').through('user_roles');
    }
  });

  return bookshelf.model('Role', Role);
};
