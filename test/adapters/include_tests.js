'use strict';

var expect = require('must');
var BPromise = require('bluebird');
var dbGetter = require('./bookshelf/db_getter');
var factoryGetter = require('./bookshelf/factory');
var _ = require('lodash');
var include = require('../../src/adapters/include');

describe('Bookshelf Include Tests', function() {
  var models, bookshelf, factory;

  before(function() {
    return dbGetter('bookshelf_tests').then(function(data) {
      models = data.models;
      bookshelf = data.bookshelf;
      factory = factoryGetter(models);
    });
  });

  it('Include gets single object no includes', function() {
    var options = {
      models: {
        post: {
          type: 'posts',
          model: models.post,
          relationships: {
            category: { name: 'category', type: 'categories' },
            author: { name: 'user', type: 'authors' },
            tags: { name: 'tag', type: 'tags'},
            comments: { name: 'comment', type: 'comments' }
          }
        },
        comment: {
          type: 'comments',
          model: models.comment,
          relationships: {
            author: { name: 'user', type: 'authors' },
            post: { name: 'post', type: 'posts' },
            reply_comment: { name: 'comment', type: 'comments' },
          }
        },
        user: {
          type: 'users',
          model: models.user,
          relationships: {
            roles: { name: 'role', type: 'roles' },
            posts: { name: 'post', type: 'posts' },
            comments: { name: 'comment', type: 'comments' },
          }
        },
        tag: {
          type: 'tags',
          model: models.tag,
          relationships: {
            posts: { name: 'post', type: 'posts' },
          }
        },
        role: {
          type: 'roles',
          model: models.role,
          relationships: {
            users: { name: 'user', type: 'users'},
          }
        }
      }
    };

    var testIncludes = include('post', null, options);

    expect(testIncludes.withRelated.length).to.equal(0);
    expect(testIncludes.includes.length).to.equal(0);
    expect(Object.keys(testIncludes.models).length).to.equal(0);
  });

  it('Include gets single object no includes with prefetch', function() {
    var options = {
      models: {
        post: {
          type: 'posts',
          model: models.post,
          relationships: {
            category: { name: 'category', type: 'categories' },
            author: { name: 'user', type: 'authors' },
            tags: { name: 'tag', type: 'tags', prefetch: true },
            comments: { name: 'comment', type: 'comments' }
          }
        },
        comment: {
          type: 'comments',
          model: models.comment,
          relationships: {
            author: { name: 'user', type: 'authors' },
            post: { name: 'post', type: 'posts' },
            reply_comment: { name: 'comment', type: 'comments' },
          }
        },
        user: {
          type: 'users',
          model: models.user,
          relationships: {
            roles: { name: 'role', type: 'roles' },
            posts: { name: 'post', type: 'posts' },
            comments: { name: 'comment', type: 'comments' },
          }
        },
        tag: {
          type: 'tags',
          model: models.tag,
          relationships: {
            posts: { name: 'post', type: 'posts' },
          }
        },
        role: {
          type: 'roles',
          model: models.role,
          relationships: {
            users: { name: 'user', type: 'users'},
          }
        }
      }
    };

    var testIncludes = include('post', null, options);

    expect(testIncludes.withRelated.length).to.equal(1);
    expect(testIncludes.withRelated[0]).to.equal('tags');
    expect(testIncludes.includes.length).to.equal(0);
    expect(Object.keys(testIncludes.models).length).to.equal(1);
    expect(testIncludes.models.post.tags).to.be.true();
  });

  it('Include gets object with includes and prefetch', function() {
    var options = {
      models: {
        post: {
          type: 'posts',
          model: models.post,
          relationships: {
            category: { name: 'category', type: 'categories' },
            author: { name: 'user', type: 'authors' },
            tags: { name: 'tag', type: 'tags', prefetch: true },
            comments: { name: 'comment', type: 'comments' }
          }
        },
        comment: {
          type: 'comments',
          model: models.comment,
          relationships: {
            author: { name: 'user', type: 'authors' },
            post: { name: 'post', type: 'posts' },
            reply_comment: { name: 'comment', type: 'comments' },
          }
        },
        user: {
          type: 'users',
          model: models.user,
          relationships: {
            roles: { name: 'role', type: 'roles' },
            posts: { name: 'post', type: 'posts' },
            comments: { name: 'comment', type: 'comments' },
          }
        },
        tag: {
          type: 'tags',
          model: models.tag,
          relationships: {
            posts: { name: 'post', type: 'posts' },
          }
        },
        role: {
          type: 'roles',
          model: models.role,
          relationships: {
            users: { name: 'user', type: 'users'},
          }
        }
      }
    };

    var testIncludes = include('post', ['comments'], options);

    expect(testIncludes.withRelated.length).to.equal(2);
    expect(testIncludes.withRelated).to.contain('tags');
    expect(testIncludes.withRelated).to.contain('comments');
    expect(testIncludes.includes.length).to.equal(1);
    expect(testIncludes.includes).to.contain('comments');
    expect(testIncludes.models.post.tags).to.be.true();
    expect(testIncludes.models.post.comments).to.be.true();
  });

  it('Include gets object with child and grandchildren', function() {
    var options = {
      models: {
        post: {
          type: 'posts',
          model: models.post,
          relationships: {
            category: { name: 'category', type: 'categories' },
            author: { name: 'user', type: 'authors' },
            tags: { name: 'tag', type: 'tags' },
            comments: { name: 'comment', type: 'comments' }
          }
        },
        comment: {
          type: 'comments',
          model: models.comment,
          relationships: {
            author: { name: 'user', type: 'authors' },
            post: { name: 'post', type: 'posts' },
            reply_comment: { name: 'comment', type: 'comments' },
          }
        },
        user: {
          type: 'users',
          model: models.user,
          relationships: {
            roles: { name: 'role', type: 'roles' },
            posts: { name: 'post', type: 'posts' },
            comments: { name: 'comment', type: 'comments' },
          }
        },
        tag: {
          type: 'tags',
          model: models.tag,
          relationships: {
            posts: { name: 'post', type: 'posts' },
          }
        },
        role: {
          type: 'roles',
          model: models.role,
          relationships: {
            users: { name: 'user', type: 'users'},
          }
        }
      }
    };

    var testIncludes = include('post', ['comments', 'comments.author'], options);

    expect(testIncludes.withRelated.length).to.equal(2);
    expect(testIncludes.withRelated).to.contain('comments');
    expect(testIncludes.withRelated).to.contain('comments.author');
    expect(testIncludes.includes.length).to.equal(2);
    expect(testIncludes.includes).to.contain('comments');
    expect(testIncludes.includes).to.contain('comments.author');
    expect(testIncludes.models.comment.author).to.be.true();
    expect(testIncludes.models.post.comments).to.be.true();
  });

  it('Include gets relationship (Included) prefetches correctly', function() {
    var options = {
      models: {
        post: {
          type: 'posts',
          model: models.post,
          relationships: {
            category: { name: 'category', type: 'categories' },
            author: { name: 'user', type: 'authors' },
            tags: { name: 'tag', type: 'tags', prefetch: true },
            comments: { name: 'comment', type: 'comments' }
          }
        },
        comment: {
          type: 'comments',
          model: models.comment,
          relationships: {
            author: { name: 'user', type: 'authors' },
            post: { name: 'post', type: 'posts' },
            reply_comment: { name: 'comment', type: 'comments' },
          }
        },
        user: {
          type: 'users',
          model: models.user,
          relationships: {
            roles: { name: 'role', type: 'roles', prefetch: true },
            posts: { name: 'post', type: 'posts' },
            comments: { name: 'comment', type: 'comments' },
          }
        },
        tag: {
          type: 'tags',
          model: models.tag,
          relationships: {
            posts: { name: 'post', type: 'posts' },
          }
        },
        role: {
          type: 'roles',
          model: models.role,
          relationships: {
            users: { name: 'user', type: 'users'},
          }
        }
      }
    };

    var testIncludes = include('post', ['author', 'comments.author'], options);

    expect(testIncludes.models.user.roles).to.be.true();
    expect(testIncludes.withRelated).to.contain('author.roles');
    expect(testIncludes.withRelated).to.contain('comments.author.roles');
    expect(testIncludes.includes).to.not.contain('author.roles');
    expect(testIncludes.includes).to.not.contain('comments.author.roles');
  });
});
