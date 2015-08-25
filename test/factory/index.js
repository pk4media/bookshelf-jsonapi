'use strict';

var BPromise = require('bluebird');
var factory = BPromise.promisifyAll(require('factory-girl'));
var BookshelfAdapter = require('factory-girl-bookshelf')();
factory.setAdapter(BookshelfAdapter);

module.exports = function(models) {
  require('fs').readdirSync(__dirname + '/').forEach(function(file) {
    if (file.match(/.+\.js/g) !== null && file !== 'index.js') {
      var name = file.replace('.js', '');
      try{
        require('./' + file)(factory, models);
      } catch(ex) {
        console.log('Error loading:', name);
      }
    }
  });

  return factory;
};
