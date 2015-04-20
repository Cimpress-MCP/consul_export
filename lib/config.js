var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));

// The default output path for the hosts outputter is in the user's home directory.  Locate that
// in a platform agnostic way.
function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

// The config path can be provided as a command-line arg or environment variable.  If not provided,
// we choose a sane default.
var config_file = argv['c'] || argv['config_file'];
if (!config_file) {
  config_file = process.env.CONSUL_EXPORT_CONFIG_FILE;
  if (!config_file) config_file = '/etc/consul_export.conf';
}

var user_config = {};

// If the config file exists, read it so we can parse it for JSON
if (fs.existsSync(config_file)) {
  try {
    var config_str = fs.readFileSync(config_file, {encoding:'utf8'});
  } catch(e) {
    console.error('Failed to read configuration file at %s', config_file);
    process.exit(1);
  }

  try {
    user_config = JSON.parse(config_str);
  } catch(e) {
    console.error('Config contents %s are not valid JSON', config_str);
    process.exit(2);
  }
}

var DEFAULT_CONFIG = {
  'consul': {
    'host': 'localhost',
    'port': '8500',
    'dc': 'dc1'
  },
  'outputters': [{
    'type': 'hosts',
    'path': getUserHome() + path.sep + 'export_hosts',
    'preamble': [
      '127.0.0.1\t\tlocalhost'
    ]
  }]
};

module.exports = _.extend(DEFAULT_CONFIG, user_config);