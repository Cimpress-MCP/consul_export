var util = require('util');

var logger = require('../logger.js').getLogger({'module': __filename});

exports.format = function(results) {
  results.forEach(function(result) {
    console.log('%s\t\t%s', result.address, result.service);
  });
};
