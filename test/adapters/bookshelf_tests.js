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

  describe('Tests with Post, comment, and tag Objects', function() {
    var post, tags, comments;

    beforeEach(function() {
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
      var testAdapter = new Adapter({
        models: {
          post: {
            type: 'posts',
            model: models.post,
            relationships: {
              category: { type: 'categories' },
              author: { type: 'users' },
              tags: { type: 'tags', prefetch: true },
              comments: { type: 'comments' }
            }
          }
        }
      });

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
      var testAdapter = new Adapter({
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
          }
        }
      });

      testAdapter.getById('post', post.id, null, ['comments'], null, function(err, data) {
        if (err) {
          done(err);
        } else {
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
            .equal('authors');
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

    it.only('Can get post by id including comments and authors on both', function(done) {
      var testAdapter = new Adapter({
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
          }
        }
      });

      testAdapter.getById('post', post.id, null,
      ['comments', 'author', 'comments.author'], null, function(err, data) {
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
