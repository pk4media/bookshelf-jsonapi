'use strict';

var expect = require('must');
var dbGetter = require('./bookshelf/db_getter');
var factoryGetter = require('./bookshelf/factory');
var BPromise = require('bluebird');
var _ = require('lodash');
var Adapter = require('../../src/adapters/bookshelf');

describe('Bookshelf Adapter Tests', function() {
  var models, bookshelf, factory;

  before(function() {
    return dbGetter('bookshelf_tests').then(function(data) {
      models = data.models;
      bookshelf = data.bookshelf;
      factory = factoryGetter(models);
    });
  });

  describe('Tests with Post Object', function() {
    var post;

    beforeEach(function() {
      //Add a post with comments and tags
      return factory.createAsync('post')
      .then(function(fetchPost) {
        post = fetchPost
        return BPromise.props({
          comments: BPromise.all(_.range(10).map(function(i) {
            return factory.createAsync('comment', {
              post_id: fetchPost.id
            });
          })),
          tags: BPromise.all(_.range(5).map(function(i) {
            return factory.createAsync('tag');
          }))
        }).then(function(values) {
          return post.tags().attach(values.tags.map(function(x) { return x.id; }));
        });
      });
    });

    it.only('Can get simple post by id', function(done) {
      var testAdapter = new Adapter(models.post, {
        rootUrl: 'http://localhost/api/v2',
        name: 'blogposts',
        relationships: [{
          name: 'category',
          type: 'categories'
        }, {
          name: 'author',
          type: 'users'
        }, {
          name: 'tags',
          type: 'tags',
          prefetch: true
        }, {
          name: 'comments',
          type: 'comments'
        }]
      });

      testAdapter.getById(post.id, null, null, null, function(err, data) {
        if (err) {
          done(err);
        } else {
          console.log(JSON.stringify(data, null, 2));
          done();
        }


      });
    });

  });

});
