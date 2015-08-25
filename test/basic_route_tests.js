'use strict';

var expect = require('must');
var testSetup = require('./setup');
var request = require('supertest-as-promised');
var factoryGetter = require('./factory')

describe('Basic Route Tests', function() {
  var app, db, factory;

  before(function() {
    return testSetup().then(function(data) {
      app = data.app;
      db = data.db;
      factory = factoryGetter(db.models);
    });
  });

  it('Can get a single object from JsonAPI', function() {
    return factory.createAsync('post')
    .then(function(tag) {
      return request(app)
      .get('/posts/' + tag.id)
      .then(function(res) {
        console.log(res.body);
      });
    });
  });

});
