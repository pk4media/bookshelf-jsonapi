'use strict';

module.exports = {

  sendError: function (statusCode, error, res) {
    return res.status(statusCode).json({ errors: [error] });
  },

  sendErrors: function (statusCode, errors, res) {
    return res.status(statusCode).json({ errors: errors });
  }
  
};
