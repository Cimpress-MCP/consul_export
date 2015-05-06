consul_export is a tool for backing up critical data from [Consul](consul.io) so that you can have a standby available in the event of catastrophic cluster failure.

##### Motivation

Before we can be comfortable using Consul for critical infrastructure, we need a disaster recovery plan that allows us to get back online in minutes even if the cluster itself is offline for an extended period (note: extended downtime is highly unlikely with Consul, but it's always best to have time to recover without worrying that each passing second is losing you money).

##### Installation

`npm install consul_export`

##### Description

consul_export is a tool for backing up critical data from [Consul](consul.io) so that you can have a standby available in the event of catastrophic cluster failure.

consul_export lets us run a warm standby of Consul DNS by exporting the current state of the cluster as static configuration for an alternative DNS server like BIND.  This server can be switched in to replace Cosnul should the cluster lose the ability to serve DNS records.

##### Configuration

consul_export is driven by a JSON configuration file.  The path to this file can be specified with the `-c [config file]` or `--config_file [config file]` command-line switches.  If no command-line switch is provided, consul_export will also look at the `CONSUL_EXPORT_CONFIG_FILE` environment variable.  Failing all of that, it will look for a configuration file at `/etc/consul_export.conf`.

If no configuration file is found at any of those locations, consul_export will use the following default:

```json
{
  "consul": {
    "host": "localhost",
    "port": "8500",
    "dc": "dc1"
  },
  "daemon": true,
  "dns": {
    "outputters": [{
      "type": "hosts",
      "path": "[user home directory]",
      "filename" : "hosts",
      "preamble": [
        "127.0.0.1\t\tlocalhost"
      ],
      "backup": {
        "path": "[system temp directory]",
        "basename": "hosts"
      }
    },{
      "type": "bind",
      "path": "[user home directory]",
      "filename": "db.consul",
      "backup": {
        "path": "[system temp directory]",
        "basename": "db.consul'
      }
    }]
  }
}
```

The `consul` stanza gives the host, port, and datacenter of a Consul agent.

`daemon` tells consul_export to run continuously, querying Consul and exporting data once per minute.  If this parameter is false, consul_export will run once and exit.

The `dns` block defines a set of outputters for emitting Consul data for external consumption.  The two supported output types are `hosts` and `bind`.  The `hosts` outputter will generate a file defining host to IP mappings suitable as a drop-in replacement for a client system's `/etc/hosts` file.  The `bind` outputter creates a zonefile that can be loaded and served by the BIND DNS server.

Each outputter defines a `path`, the root directory in which the file will be output, as well as a `filename`.  In the case of the `hosts` outputter, you can also define a `preamble`, an array of lines that will be written at the start of the file.  This is useful because `/etc/hosts` files start with a mapping of localhost to 127.0.0.1.  You can extend this to add additional static configuration that you know must be in your hosts file.

Each outputter can also define a `backup` stanza.  Based on the `path` and `basename` provided, the backup policy will create hourly, daily, and weekly backups of the output file.  The names of these backup files are the concatenation of `path`, `basename`, type (weekly|daily|hourly), and timestamp.  For example, the hourly backup for a hosts file with `basename` "hosts" at `path` "/tmp" might be named "/tmp//hosts.hourly.20150506T2037".

##### Limitations

Currently, consul_export is focused exclusively on exporting entries from Consul DNS.  It would be nice to extend it to support K/V export or ACL export.

Also, it's important to note that consul_export is targeted at enabling external systems to run using state extracted from Consul: in the future, perhaps consul_export should support reading in backup state and repopulating a Consul cluster.

##### TODO

- [x] Add backup state files
- [x] Do not export if errors occur
- [x] Add daemon mode

##### CI

Builds are automatically run by Travis on any push or pull request.

![Travis Status](https://api.travis-ci.org/Cimpress-MCP/consul_export.svg?branch=master)