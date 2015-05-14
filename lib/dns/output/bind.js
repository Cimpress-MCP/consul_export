var fs = require('fs');
var sep = require('path').sep;
var util = require('util');

var logger = require('../../util/logger.js').getLogger({'module': __filename});

module.exports = function(outputter_config) {

  var write_stream = fs.createWriteStream(outputter_config.path + sep + outputter_config.filename);
  var reverse_write_stream = fs.createWriteStream(outputter_config.path + sep + outputter_config.filename + '.reverse');

  if (outputter_config.reload_command) {
    var command_args = outputter_config.reload_command.split(' ');
    var reload_command = command_args.shift();
  }

  return function(results, cb) {
    var soa = "@\tIN\tSOA\tns.consul.\tpostmaster.consul.\t(1429312020\t3600\t600\t86400\t0)";

    var ttl = "$TTL 15"
    var ns = "@\tIN\tNS\tlocalhost";
    var localhost = "localhost\tIN\tA\t127.0.0.1";

    [ttl, soa, ns, localhost].forEach(function(section) {
      write_stream.write(section);
      write_stream.write('\n');
    });

    [ttl, soa, ns + '.'].forEach(function(section) {
      reverse_write_stream.write(section);
      reverse_write_stream.write('\n');
    });

    results.forEach(function(result) {
      if (result.service) {
        var service_parts = result.service.split('.');
        var tld_length = service_parts[service_parts.length-1].length;
        var dc_length = service_parts[service_parts.length-2].length;
        var service_name_short = result.service.substring(0, result.service.length-(tld_length+dc_length+2));
        var service_name_long = result.service.substring(0, result.service.length-(tld_length+1));
        write_stream.write(util.format('%s\tIN\tA\t%s\n', service_name_long, result.address));
        write_stream.write(util.format('%s\tIN\tA\t%s\n', service_name_short, result.address));
      }

      if (result.node) {
        write_stream.write(util.format('%s.node\tIN\tA\t%s\n', result.node, result.address));
        write_stream.write(util.format('%s.node.%s\tIN\tA\t%s\n', result.node, result.dc, result.address));

        var ip_parts_reversed = result.address.split('.').reverse();
        ip_parts_reversed.pop();
        ip_parts_reversed = ip_parts_reversed.join('.');
        reverse_write_stream.write(util.format('%s\tIN\tPTR\t%s.node.%s.consul.\n', ip_parts_reversed, result.node, result.dc));
      }
    });

    write_stream.end(function(err) {
      if (err) return cb(err);

      // If configured, trigger a bash reload.
      if (outputter_config.reload_command) {
        logger.debug('Running reload command %s with args %s', reload_command, command_args);
        require('child_process').spawn(reload_command, command_args, {'cwd': '/tmp'});
      }

      cb();
    });
  }
};
