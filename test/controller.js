'use strict';

var expect = require('must');
var Controller = require('../src/controller');

var db = require('./db_getter')('controller_tests');

describe('Controller Tests', function() {

  beforeEach(function() {

  });

  it.only('getRouter returns express router with basic routes required', function() {
    var testController = new Controller(db.models.post);

    var router = testController.getRouter();
    var foundIdRoute = false, foundNonIdRoute = false;
    router.stack.forEach(function(route) {
      if (route.route.path.indexOf(':id') >= 0) {
        foundIdRoute = true;
        expect(route.route.path).to.equal('/posts/:id');
        expect(route.route.methods.get).to.be.true();
        expect(route.route.methods.patch).to.be.true();
        expect(route.route.methods.delete).to.be.true();
      } else {
        foundNonIdRoute = true;
        expect(route.route.path).to.equal('/posts');
        expect(route.route.methods.get).to.be.true();
        expect(route.route.methods.post).to.be.true();
      }
    });
    expect(foundIdRoute).to.be.true();
    expect(foundNonIdRoute).to.be.true();
  });

});
