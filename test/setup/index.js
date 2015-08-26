'use strict';

var Controller = require('../../src/controller');
var dbGetter = require('./db_getter');
var app = require('express')();
var bodyParser = require('body-parser');

app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(bodyParser.urlencoded({ extended: true }));

module.exports = function() {
  return dbGetter('controller_tests').then(function(createdDb) {
    app.use('/', new Controller(createdDb.models.category).getRouter());
    app.use('/', new Controller(createdDb.models.comment).getRouter());
    app.use('/', new Controller(createdDb.models.post, {
      rootUrl: '',
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
    }).getRouter());
    app.use('/', new Controller(createdDb.models.role).getRouter());
    app.use('/', new Controller(createdDb.models.tag).getRouter());
    app.use('/', new Controller(createdDb.models.user).getRouter());

    return {
      app: app,
      db: createdDb
    };
  });
};
