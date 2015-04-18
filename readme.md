consul_export is a tool for backing up critical data from [Consul](consul.io) such that you can retain a backup in the event of catastrophic cluster failures.

##### Motivation

Before we can be comfortable using Consul for critical infrastructure, we need a disaster recovery plan that allows us to get back online in minutes even if the cluster itself is offline for hours (note: a cluster being offline for hours is highly unlikely, but it's always best to have time to recover gracefully without worrying that each passing second is losing you money).  consul_export lets us run a warm standby of Consul DNS by exporting the current state of the cluster as static configuration for an alternative DNS server like BIND.

##### Installation

`npm install consul_export`
