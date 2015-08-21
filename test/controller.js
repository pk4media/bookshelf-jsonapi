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

  it.only('getRouter returns express router with basic routes required', function() {
    var TestModel = bookshelf.Model.extend({
      tableName: 'testmodels'
    });

    var testController = new Controller(TestModel);

    var router = testController.getRouter();
    var foundIdRoute = false, foundNonIdRoute = false;
    router.stack.forEach(function(route) {
      if (route.route.path.indexOf(':id') >= 0) {
        foundIdRoute = true;
        expect(route.route.path).to.equal('/testmodels/:id');
        expect(route.route.methods.get).to.be.true();
        expect(route.route.methods.patch).to.be.true();
        expect(route.route.methods.delete).to.be.true();
      } else {
        foundNonIdRoute = true;
        expect(route.route.path).to.equal('/testmodels');
        expect(route.route.methods.get).to.be.true();
        expect(route.route.methods.post).to.be.true();
      }
    });
    expect(foundIdRoute).to.be.true();
    expect(foundNonIdRoute).to.be.true();
  });

});
