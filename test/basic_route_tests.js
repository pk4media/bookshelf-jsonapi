'use strict';

var expect = require('must');
var testSetup = require('./setup');
var request = require('supertest-as-promised');
var factoryGetter = require('./factory');
var BPromise = require('bluebird');
var _ = require('lodash');

describe('Basic Route Tests', function() {
  var app, db, factory;

  before(function() {
    return testSetup().then(function(data) {
      app = data.app;
      db = data.db;
      factory = factoryGetter(db.models);
    });
  });

  it.only('Can get a single object from JsonAPI', function() {
    return factory.createAsync('post')
    .then(function(post) {
      return BPromise.props({
        comments: BPromise.all(_.range(10).map(function(i) {
          return factory.createAsync('comment', {
            post_id: post.id
          });
        })),
        tags: BPromise.all(_.range(5).map(function(i) {
          return factory.createAsync('tag');
        }))
      }).then(function(values) {
        return post.tags().attach(values.tags.map(function(x) { return x.id; }))
        .then(function() {
          return request(app)
          .get('/posts/' + post.id)
          .query({includes: 'tags'})
          .then(function(res) {
            console.log(JSON.stringify(res.body, null, 2));
          });
        });
      });
    });
  });

});
