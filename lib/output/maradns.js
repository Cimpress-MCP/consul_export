var fs = require('fs');
var util = require('util');

var logger = require('../logger.js').getLogger({'module': __filename});

module.exports = function(outputter_config) {

  var write_stream = fs.createWriteStream(outputter_config.path);

  return function(results, cb) {
    var soa = outputter_config.soa || "Sconsul.|0|ns.consul.|postmaster.consul.|1429312020|3600|600|86400|0";

    write_stream.write(soa);
    write_stream.write('\n');

    results.forEach(function(result) {
      write_stream.write(util.format('A%s.|15|%s\n', result.service, result.address));
    });

    write_stream.end(cb);
  }
};
