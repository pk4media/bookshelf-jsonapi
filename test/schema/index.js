'use strict';
var fs = require('fs');

module.exports = function(knex) {
  return fs.readdirSync(__dirname + '/').map(function(file) {
    try{
      if (file.match(/.+\.js/g) !== null && file !== 'index.js') {
        return require('./' + file)(knex);
      }
    } catch(ex) {
      console.log('Error loading database script file: ', file);
    }
  });
};
