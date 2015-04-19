var consul_export = require('./lib/');

var logger = require('./lib/logger.js').getLogger({'module': __filename});

// Register the catch-all exception handler.  We want to ignore this line for code coverage purposes,
// which the instanbul ignore line accomplishes.
process.on('uncaughtException', /* istanbul ignore next */ function(err) {
  // If an exception blew up a function, log it.  We'll want to audit these via logstash and address the
  // root cause.
  logger.error(err);
});

var config = {
  outputters: ['hosts', 'maradns']
};

consul_export.run(config);