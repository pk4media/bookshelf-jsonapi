'use strict';

module.exports = function(context, req, res, next, tasks) {
  //reduce tasks into a chain of callbacks with the check for errors
  var caller = tasks.reduce(function(previousValue, currentValue, index, array) {
    return function(err) {
      if (err) {
        next(err);
      } else {
        array[array.length - index - 1].call(context, req, res, previousValue);
      }
    };
  }, next);

  caller(); //call the
};
