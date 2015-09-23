'use strict';

var expect = require('must');
var dbGetter = require('./bookshelf/db_getter');
var factoryGetter = require('./bookshelf/factory');
var BPromise = require('bluebird');
var _ = require('lodash');
var Adapter = require('../../src/adapters/bookshelf');

describe('Bookshelf Adapter Tests', function() {
  var models, bookshelf, factory, testAdapter;


  before(function() {
    return dbGetter('bookshelf_tests').then(function(data) {
      models = data.models;
      bookshelf = data.bookshelf;
      factory = factoryGetter(models);

      //default start for all test for this adapter
      testAdapter = new Adapter({
        models: {
          post: {
            type: 'posts',
            model: models.post,
            relationships: {
              category: { name: 'category' },
              author: { name: 'user' },
              tags: { name: 'tag', prefetch: true },
              comments: { name: 'comment' }
            }
          },
          comment: {
            type: 'comments',
            model: models.comment,
            relationships: {
              author: { name: 'user' },
              post: { name: 'post' },
              reply_comment: { name: 'comment' },
            }
          },
          user: {
            type: 'users',
            model: models.user,
            relationships: {
              roles: { name: 'role', prefetch: true },
              posts: { name: 'post' },
              comments: { name: 'comment' },
            }
          },
          tag: {
            type: 'tags',
            model: models.tag,
            relationships: {
              posts: { name: 'post' },
            }
          },
          role: {
            type: 'roles',
            model: models.role,
            relationships: {
              users: { name: 'user' },
            }
          },
          category: {
            type: 'categories',
            model: models.category,
            relationships: {
              posts: { name: 'post' },
            }
          }
        }
      });
    });
  });

  describe('Tests with Post, comments, and tags Objects', function() {
    var post, tags, comments;

    before(function() {
      //Add a post with comments and tags
      return factory.createAsync('post')
      .then(function(fetchPost) {
        post = fetchPost;
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
          tags = values.tags;
          comments = values.comments;
          return post.tags().attach(values.tags.map(function(x) { return x.id; }));
        });
      });
    });

    it('Can get simple post by id', function(done) {
      testAdapter.getById('post', post.id, null, null, null, function(err, data) {
        if (err) {
          done(err);
        } else {
          //console.log(JSON.stringify(data, null, 2));

          //Test proper JSON API
          expect(data.data).to.be.an.object();
          expect(data.data.type).to.equal('posts');
          expect(data.data.id).to.equal(post.id.toString());

          expect(data.data.attributes).to.be.an.object();
          expect(Object.keys(data.data.attributes).length).to.equal(2);
          expect(data.data.attributes.post_text).to.equal(post.get('post_text'));
          expect(new Date(data.data.attributes.post_date)).to.be.a.date();

          expect(data.data.relationships).to.be.an.object();
          expect(Object.keys(data.data.relationships).length).to.equal(4);

          expect(data.data.relationships.category).to.be.an.object();
          expect(data.data.relationships.category.links).to.be.an.object();
          expect(data.data.relationships.category.links.self).to
          .equal('/post/1/relationships/category');
          expect(data.data.relationships.category.links.related).to
          .equal('/post/1/category');
          expect(data.data.relationships.category.data).to.be.an.object();
          expect(data.data.relationships.category.data.type).to
          .equal('categories');
          expect(data.data.relationships.category.data.id).to
          .equal(post.get('category_id').toString());

          expect(data.data.relationships.author).to.be.an.object();
          expect(data.data.relationships.author.links).to.be.an.object();
          expect(data.data.relationships.author.links.self).to
          .equal('/post/1/relationships/author');
          expect(data.data.relationships.author.links.related).to
          .equal('/post/1/author');
          expect(data.data.relationships.author.data).to.be.an.object();
          expect(data.data.relationships.author.data.type).to
          .equal('users');
          expect(data.data.relationships.author.data.id).to
          .equal(post.get('author_id').toString());

          expect(data.data.relationships.tags).to.be.an.object();
          expect(data.data.relationships.tags.links).to.be.an.object();
          expect(data.data.relationships.tags.links.self).to
          .equal('/post/1/relationships/tags');
          expect(data.data.relationships.tags.links.related).to
          .equal('/post/1/tags');
          expect(data.data.relationships.tags.data.length).to.equal(5);

          for (var i = 0, len = tags.length; i < len; i++) {
            expect(data.data.relationships.tags.data[i].type).to
            .equal('tags');
            expect(data.data.relationships.tags.data[i].id).to
            .equal(tags[i].id.toString());
          }

          expect(data.data.relationships.comments).to.be.an.object();
          expect(data.data.relationships.comments.links).to.be.an.object();
          expect(data.data.relationships.comments.links.self).to
          .equal('/post/1/relationships/comments');
          expect(data.data.relationships.comments.links.related).to
          .equal('/post/1/comments');

          done();
        }
      });
    });

    it('Can get post by id including comments', function(done) {
      testAdapter.getById('post', post.id, null, ['comments'], null, function(err, data) {
        if (err) {
          done(err);
        } else {
          //console.log(JSON.stringify(data, null, 2));

          expect(data.data.relationships.comments).to.be.an.object();
          expect(data.data.relationships.comments.data.length).to.equal(10);
          expect(data.included.length).to.equal(10);

          for (var i = 0, len = comments.length; i < len; i++) {
            expect(data.data.relationships.comments.data[i].type).to
            .equal('comments');
            expect(data.data.relationships.comments.data[i].id).to
            .equal(comments[i].id.toString());

            expect(data.included[i].type).to.equal('comments');
            expect(data.included[i].id).to.equal(comments[i].id.toString());

            expect(data.included[i].attributes).to.be.an.object();
            expect(Object.keys(data.included[i].attributes).length).to.equal(2);
            expect(data.included[i].attributes.text).to
            .equal(comments[i].get('text'));
            expect(new Date(data.included[i].attributes.comment_date)).to.be.a
            .date();

            expect(data.included[i].relationships).to.be.an.object();

            expect(data.included[i].relationships.author.links).to.be.an.object();
            expect(data.included[i].relationships.author.links.self).to
            .equal('/comment/' + comments[i].id + '/relationships/author');
            expect(data.included[i].relationships.author.links.related).to
            .equal('/comment/' + comments[i].id + '/author');
            expect(data.included[i].relationships.author.data).to.be.an.object();
            expect(data.included[i].relationships.author.data.type).to
            .equal('users');
            expect(data.included[i].relationships.author.data.id).to
            .equal(comments[i].get('author_id').toString());

            expect(data.included[i].relationships.post.links).to.be.an.object();
            expect(data.included[i].relationships.post.links.self).to
            .equal('/comment/' + comments[i].id + '/relationships/post');
            expect(data.included[i].relationships.post.links.related).to
            .equal('/comment/' + comments[i].id + '/post');
            expect(data.included[i].relationships.post.data).to.be.an.object();
            expect(data.included[i].relationships.post.data.type).to
            .equal('posts');
            expect(data.included[i].relationships.post.data.id).to
            .equal(comments[i].get('post_id').toString());

            expect(data.included[i].relationships.reply_comment.links).to.be.an
            .object();
            expect(data.included[i].relationships.reply_comment.links.self).to
            .equal('/comment/' + comments[i].id + '/relationships/reply_comment');
            expect(data.included[i].relationships.reply_comment.links.related).to
            .equal('/comment/' + comments[i].id + '/reply_comment');
            expect(data.included[i].relationships.reply_comment.data).to.be.null();
          }

          done();
        }
      });
    });

    it('Can get post by id including comments and authors on both', function(done) {
      testAdapter.getById('post', post.id, null,
      ['author', 'comments.author'], null, function(err, data) {
        if (err) {
          done(err);
        } else {
          //console.log(JSON.stringify(data, null, 2));

          data.included.forEach(function(include) {
            switch (include.type) {
              case 'comments':
                expect(_.some(comments, function(comment) {
                  return comment.id.toString() == include.id;
                })).to.be.true();
                break;
              case 'users':
                if (include.id !== data.data.relationships.author.data.id) { //Not post author
                  expect(_.some(comments, function(comment) {
                    return comment.get('author_id').toString() === include.id;
                  })).to.be.true();
                }
                break;
              default:
                throw new Error(include.type + ' type shouldnt be in the included section.');
            }
          });
          done();
        }
      });
    });

    it('Can get post comments relationships', function(done) {
      testAdapter.getRelationshipById('post', post.id, 'comments',
      function(err, data) {
        if (err) {
          done(err);
        } else {
          //console.log(JSON.stringify(data, null, 2));

          expect(data.links.self).to.equal('/post/' + post.id +
            '/relationships/comments');
          expect(data.links.related).to.equal('/post/' + post.id + '/comments');
          expect(data.data).to.be.an.array();
          expect(data.data.length).to.equal(10);
          data.data.forEach(function(relData) {
            expect(relData.type).to.equal('comments');
            expect(_.some(comments, function(comment) {
              return comment.id.toString() === relData.id;
            })).to.be.true();
          });

          done();
        }
      });
    });

    it('Can get all comments', function(done) {
      testAdapter.get('comment', null, null, null, function(err, data) {
        if (err) {
          done(err);
        } else {
          //console.log(JSON.stringify(data, null, 2));

          expect(data.data).to.be.an.array();
          expect(data.data.length).to.equal(10);

          data.data.forEach(function(dataComment) {
            expect(dataComment.type).to.equal('comments');
            expect(_.some(comments, function(comment) {
              return comment.id.toString() === dataComment.id;
            })).to.be.true();
          });

          done();
        }
      });
    });

    it('Can get all comments with authors', function(done) {
      testAdapter.get('comment', null, ['author'], null, function(err, data) {
        if (err) {
          done(err);
        } else {
          //console.log(JSON.stringify(data, null, 2));

          expect(data.included).to.be.an.array();
          expect(data.included.length).to.equal(10);

          data.included.forEach(function(dataUser) {
            expect(dataUser.type).to.equal('users');
            expect(_.some(comments, function(comment) {
              return comment.get('author_id').toString() === dataUser.id;
            })).to.be.true();
          });

          done();
        }
      });
    });

    it('Can get post comments testing hasMany', function(done) {
      testAdapter.getRelationshipDataById('post', post.id, 'comments', null, null,
      null, function(err, data) {
        if (err) {
          done(err);
        } else {
          //console.log(JSON.stringify(data, null, 2));

          expect(data.data).to.be.an.array();
          expect(data.data.length).to.equal(10);
          data.data.forEach(function(comment) {
            expect(comment.relationships.post.data.id).to.equal(post.id.toString());
          });

          done();
        }
      });
    });

    it('Can get post tags testing many to many', function(done) {
      testAdapter.getRelationshipDataById('post', post.id, 'tags', null, null,
      null, function(err, data) {
        if (err) {
          done(err);
        } else {
          //console.log(JSON.stringify(data, null, 2));

          expect(data.data).to.be.an.array();
          expect(data.data.length).to.equal(5);

          done();
        }
      });
    });

    it('Can get post tags testing many to many includinging posts', function(done) {
      testAdapter.getRelationshipDataById('post', post.id, 'tags', null, ['posts'],
      null, function(err, data) {
        if (err) {
          done(err);
        } else {
          //console.log(JSON.stringify(data, null, 2));

          expect(data.data).to.be.an.array();
          expect(data.data.length).to.equal(5);

          expect(data.included).to.be.an.array();
          expect(data.included.length).to.equal(1);

          done();
        }
      });
    });
  });

  it('Get by id returns null when item not found', function(done) {
    testAdapter.getById('post', -1, null, null, null, function(err, data) {
      expect(err).to.be.null();
      expect(data).to.be.null();
      done();
    });
  });

  it('Get by relationship id returns null when item not found', function(done) {
    testAdapter.getRelationshipById('post', -1, 'comments', function(err, data) {
      expect(err).to.be.null();
      expect(data).to.be.null();
      done();
    });
  });
});
