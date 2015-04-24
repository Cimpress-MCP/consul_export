var fs = require('fs');
var util = require('util');

var logger = require('../../util/logger.js').getLogger({'module': __filename});

module.exports = function(outputter_config) {

  var write_stream = fs.createWriteStream(outputter_config.path);

  return function(results, cb) {
    var soa = "@\tIN\tSOA\tns.consul.\tpostmaster.consul.\t(1429312020\t3600\t600\t86400\t0)";

    var ttl = "$TTL 15"
    var ns = "@\tIN\tNS\tlocalhost";
    var localhost = "localhost\tIN\tA\t127.0.0.1";

    [ttl, soa, ns, localhost].forEach(function(section) {
      write_stream.write(section);
      write_stream.write('\n');
    });

    results.forEach(function(result) {
      var service_parts = result.service.split('.');
      write_stream.write(util.format('%s.%s.%s\tIN\tA\t%s\n', service_parts[0], service_parts[1], service_parts[2], result.address));
      write_stream.write(util.format('%s.%s\tIN\tA\t%s\n', service_parts[0], service_parts[1], result.address));
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