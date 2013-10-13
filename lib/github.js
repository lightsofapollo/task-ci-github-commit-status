var Github = require('github');

module.exports.create = function() {
  return new Github({
    version: '3.0.0'
  });
};

