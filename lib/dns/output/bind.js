var fs = require('fs');
var util = require('util');

var logger = require('../../util/logger.js').getLogger({'module': __filename});

module.exports = function(outputter_config) {

  var write_stream = fs.createWriteStream(outputter_config.path);

  return function(results, cb) {
    var soa = "@\tIN\tSOA\tns.consul.\tpostmaster.consul.\t(1429312020\t3600\t600\t86400\t0)";

    write_stream.write(soa);
    write_stream.write('\n');

    results.forEach(function(result) {
      write_stream.write(util.format('%s\tIN\tA\t%s\n', result.service, result.address));
    });

    write_stream.end(cb);
  }
};