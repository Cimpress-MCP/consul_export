var fs = require('fs');
var moment = require('moment');
var sep = require('path').sep;
var _ = require('underscore');

var logger = require('./util/logger.js').getLogger({'module': __filename});

// The default backup strategy is to keep versions of files that are an
// hour old, a day old, and a week old.  If backup files with those ages
// aren't yet seeded, we create an immediate backup and allow it to age
// until it reaches that threshold.  At this point, a new backup file
// is created.  Backup files are reaped when they reach 2x the backup
// threshold (that is, the oldest weekly backup will be deleted when we
// hit 2 weeks).
//
// Backup files are specified with a path, such as /tmp/, and a name, such
// as db.consul.  The type (weekly, daily, hourly) and timestamp are then
// appended to that identifier, yielding a full backup file such as:
//      /tmp/db.consul.weekly.20150505T1719
// This represents the weekly backup populated at 17:19GMT on 2015-05-05.

var thresholds = {
  'weekly': 1000 * 60 * 60 * 24 * 7,
  'daily': 1000 * 60 * 60 * 24,
  'hourly': 1000 * 60 * 60,
};

var current_date_str = function() {
  return moment().utc().format('YYYYMMDDTHHmm');
};

var date_to_ms = function(date_str) {
  return moment.utc(date_str, 'YYYYMMDDTHHmmss').valueOf();
};

var create_backup_file = function(outputter, path, basename, type, results) {
    var backup_outputter = _.clone(outputter);
    backup_outputter.path = path;
    backup_outputter.filename = basename + '.' + type + '.' + current_date_str();

    logger.info("Generating backup file %s/%s", backup_outputter.path, backup_outputter.filename);

    require('./dns/output/' + outputter.type + '.js')(backup_outputter)(results, function(err) {
      if (err) logger.error("Failed to write backup file due to %s", err);
    });
};

var gather_backup_files = function(path, basename) {
  var backups = {
    'weekly': [],
    'daily': [],
    'hourly': []
  };

  var files = fs.readdirSync(path);
  files.forEach(function(file) {
    if (file.indexOf(basename) != -1) {
      // This looks like a backup file.  Try to parse its date and type.
      try {
        var parts = file.split('.');

        // If this is a reverse lookup backup, drop that component
        if (parts[parts.length-1] === 'reverse') {
          parts.pop();
        }

        var date_str = parts[parts.length-1];
        var type = parts[parts.length-2];
        if (!thresholds[type]) {
          return logger.debug("Invalid type %s in backup file %s", type, file);
        }

        var ms = date_to_ms(date_str);
        backups[type].push({
          'time': ms,
          'filename': path + sep + file
        });
      } catch(e) {
        logger.debug('Saw invalid backup file %s: %s', file, e);
      }
    }
  });

  return backups;
};

module.exports.populate = function(outputter, results) {

  var backup_config = outputter.backup;

  // Grab the current epoch ms to use for date math.
  var now = new Date().getTime();

  // Grab the current set of backups, if any.
  var backups = gather_backup_files(backup_config.path, backup_config.basename);

  ['weekly', 'daily', 'hourly'].forEach(function(type) {
    var current_backup_found = false;

    backups[type].forEach(function(backup) {
      var age = now - backup.time;
      // If the age of this backup is twice the threshold age for this type of backup,
      // purge it.
      if (age > (thresholds[type] * 2)) {
        logger.info("Backup %s aging off", backup.filename);
        fs.unlinkSync(backup.filename);
      }

      if (age < thresholds[type]) current_backup_found = true;
    });

    // If there's no viable backup file, create one.
    if (!current_backup_found) {
      create_backup_file(outputter, backup_config.path, backup_config.basename, type, results);
    }
  });
};
