'use strict';

var expect = require('must');
var Controller = require('../src/controller');

var dbGetter = require('./db_getter');

describe('Controller Tests', function() {
  var db;

  before(function() {
    return dbGetter('controller_tests').then(function(createdDb) {
      db = createdDb;
      return db.models.role.forge({ name: 'test' }).save();
    });
  });

  it.only('getRouter returns express router with basic routes required', function() {
    var testController = new Controller(db.models.post);

    var router = testController.getRouter();
    router.stack.forEach(function(route) {
      if (route.route.path === '/posts/:id') {
        expect(route.route.methods.get).to.be.true();
        expect(route.route.methods.patch).to.be.true();
        expect(route.route.methods.delete).to.be.true();
      } else if(route.route.path === '/posts') {
        expect(route.route.methods.get).to.be.true();
        expect(route.route.methods.post).to.be.true();
      } else {
        throw new Error('The following path should exist in the routes: ' +
        route.route.path);
      }
    });
  });

});
