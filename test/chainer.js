'use strict';

var expect = require('must');
var chainer = require('../src/chainer');

describe('Chainer Tests', function() {

  it('goes through all tasks passing request response', function(testnext) {
    var req = { name: 'req', id: 0 };
    var res = { name: 'res' };

    var task = function(id) {
      return function(req, res, next) {
        expect(id).to.be.above(req.id);
        expect(req.name).to.equal('req');
        expect(res.name).to.equal('res');
        req.id = id;
        next();
      };
    };

    var tasks = [task(1), task(2), task(3)];

    var testNext = function(err) {
      expect(req.id).to.be.equal(3); //ran all 3 tasks
      testnext();
    };

    chainer(req, res, testNext, tasks);
  });

  it('if hit error in tasks call final next with err', function(testnext) {
    var req = { name: 'req', id: 0 };
    var res = { name: 'res' };

    var task = function(id) {
      return function(req, res, next) {
        req.id = id;
        if (id === 2) {
          next({ message: 'error' });
        } else {
          next();
        }
      };
    };

    var tasks = [task(1), task(2), task(3)];

    var testNext = function(err) {
      expect(err.message).to.equal('error'); //Got error message
      expect(req.id).to.be.equal(2); //ran only 2 tasks
      testnext();
    };

    chainer(req, res, testNext, tasks);
  });
});
