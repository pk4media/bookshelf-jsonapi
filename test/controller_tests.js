'use strict';

var expect = require('must');
var testSetup = require('./setup');
var Controller = require('../src/controller');

describe('Controller Tests', function() {
  var app,db;

  before(function() {
    return testSetup().then(function(data) {
      app = data.app;
      db = data.db;
    });
  });

  it('getRouter returns express router with basic routes required', function() {
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
