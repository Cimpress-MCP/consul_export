var fs = require('fs');
var util = require('util');

var logger = require('../../util/logger.js').getLogger({'module': __filename});

module.exports = function(outputter_config) {

  var write_stream = fs.createWriteStream(outputter_config.path);

  return function(results, cb) {
    var soa = "@\tIN\tSOA\tns.consul.\tpostmaster.consul.\t(1429312020\t3600\t600\t86400\t0)";

    var ns = "@\tIN\tNS\tconsul.";
    var a = "@\tIN\tA\t127.0.0.1";

    write_stream.write(soa);
    write_stream.write('\n');
    write_stream.write(ns);
    write_stream.write('\n');
    write_stream.write(a);
    write_stream.write('\n');

    results.forEach(function(result) {
      write_stream.write(util.format('%s\tIN\tA\t%s\n', result.service, result.address));
    });

    write_stream.end(cb);

    console.log("BIND db created at %s", outputter_config.path);
    console.log("Update your BIND named.conf.local to contain a block like this:\n")
    console.log("zone \"consul\" {");
    console.log("         type master;");
    console.log("         file \"%s\";", outputter_config.path);
    console.log("};");
  }
};