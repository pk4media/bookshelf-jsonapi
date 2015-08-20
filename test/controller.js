'use strict';

var expect = require('must');
var Controller = require('../src/controller');

var knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: "./mytestdb" }
});

var bookshelf = require('bookshelf')(knex);

describe('Controller Tests', function() {

  beforeEach(function() {
    return bookshelf.knex.schema.hasTable('testmodel').then(function(exists){
      if (exists) {
        return bookshelf.knex.schema.dropTable('testmodel');
      }
    }).then(function() {
      return bookshelf.knex.schema.createTable('testmodel', function (table) {
        table.increments();
        table.string('name');
        table.string('status');
        table.timestamps();
      });
    });
  });

  it('getRouter returns express router with basic routes required', function() {
    var TestModel = bookshelf.Model.extend({
      tableName: 'testmodel'
    });

    var testController = new Controller(TestModel);

    var router = testController.getRouter();
    console.log(router);
  });

});
