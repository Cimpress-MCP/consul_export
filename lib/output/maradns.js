var util = require('util');

var logger = require('../logger.js').getLogger({'module': __filename});

var soa = "Sconsul.|0|ns.consul.|postmaster.consul.|1429312020|3600|600|86400|0";

exports.format = function(results) {

  console.log(soa);

  results.forEach(function(result) {
    console.log('A%s.|15|%s', result.service, result.address);
  });
};
