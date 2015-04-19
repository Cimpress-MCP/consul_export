consul_export is a tool for backing up critical data from [Consul](consul.io) so that you can have a standby available in the event of catastrophic cluster failure.

##### Motivation

Before we can be comfortable using Consul for critical infrastructure, we need a disaster recovery plan that allows us to get back online in minutes even if the cluster itself is offline for an extended period (note: extended downtime is highly unlikely with Consul, but it's always best to have time to recover without worrying that each passing second is losing you money).

##### Installation

`npm install consul_export`

##### Description

consul_export is a tool for backing up critical data from [Consul](consul.io) so that you can have a standby available in the event of catastrophic cluster failure.

consul_export lets us run a warm standby of Consul DNS by exporting the current state of the cluster as static configuration for an alternative DNS server like BIND.  This server can be switched in to replace Cosnul should the cluster lose the ability to serve DNS records.

##### Limitations

Currently, consul_export is focused exclusively on exporting entries from Consul DNS.  It would be nice to extend it to support K/V export or ACL export.

Also, it's important to note that consul_export is targeted at enabling external systems to run using state extracted from Consul: in the future, perhaps consul_export should support reading in its own state and repopulating a Consul cluster.