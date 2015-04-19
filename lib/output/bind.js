var util = require('util');

var logger = require('../logger.js').getLogger({'module': __filename});

var soa = "@\tIN\tSOA\tns.consul.\tpostmaster.consul.\t(1429312020\t3600\t600\t86400\t0)";

exports.format = function(results) {

  console.log(soa);

  results.forEach(function(result) {
    console.log('%s\tIN\tA\t%s', result.service, result.address);
  });
};
