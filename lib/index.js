var _ = require('underscore');
var ordering = require('./ordering.js').from();
var request = require('request');
var util = require('util');

var config = require('./config.js');

var logger = require('./logger.js').getLogger({'module': __filename});

/**
 * Given the results of the Consul query operations (which return an object containing each
 * service and the set of nodes currently alive for that service), create an array with each
 * service name to address mapping, including service names prefixed by tags.  Sort this
 * array by service name and, within that, by IP.
 */
var preprocess_results = function(results) {
  var records = [];

  var services = Object.getOwnPropertyNames(results);
  services.forEach(function(service) {
    var nodes_for_service = results[service];
    nodes_for_service.forEach(function(node) {
      // Convert the IP address into a form that makes sorting more natural.
      var address_long = 0;
      var address_array = node.Node.Address.split('.');
      for (var i=0; i < address_array.length; i++) {
        var power = 3 - i;
        address_long += ((parseInt(address_array[i]) % 256 * Math.pow(256, power)));
      }

      var service_group = util.format('%s.service.lex.consul', service);
      records.push({
        'service_group': service_group,
        'service': service_group,
        'address': node.Node.Address,
        'address_long': address_long
      });
      tags_for_node = node.Service.Tags;
      if (tags_for_node) {
        tags_for_node.forEach(function(tag) {
          records.push({
            'service_group': service_group,
            'service': util.format('%s.%s', tag, service_group),
            'address': node.Node.Address,
            'address_long': address_long
          });
        });
      }
    });
  });

  // After preprocessing the records, group and sort them by service name.
  records.sort(ordering.onPath('.service_group').compound(ordering.onPath('.service').compound(ordering.onPath('address_long'))));

  return records;
};

/**
 * Given an array of results, render it using the configured outputter(s).
 */
var render_results = function(results) {
  config.outputters.forEach(function(outputter) {
    require('./output/' + outputter.type + '.js')(outputter)(results, function(err) {
      if (err) return logger.error('Failed to process outputter %s due to %s', outputter.type, err);
      logger.info('Completed outputter of type %s', outputter.type);
    });
  });
};

/**
 * Connect to Consul and build a result set
 */
var gather_consul_data = function(cb) {
  request(util.format('http://%s:%s/v1/catalog/services', config.consul.host, config.consul.port), function(err, res, body) {
    var body = JSON.parse(body);

    var services = Object.getOwnPropertyNames(body);
    var target = services.length;

    var results = {};
    cb = _.after(services.length, cb);

    services.forEach(function(service) {
      request(util.format('http://%s:%s/v1/health/service/%s?passing', config.consul.host, config.consul.port, service), function(err, res, body) {
        var body = JSON.parse(body);
        results[service] = body;
        cb(null, results);
      });
    });
  });
}

/**
 * Given a configuration object, gather data from Consul and render it using the configured outputters.
 */
exports.run = function() {
  gather_consul_data(function(err, results) {
    render_results(preprocess_results(results));
  });
};
