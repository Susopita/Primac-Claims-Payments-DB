CREATE KEYSPACE IF NOT EXISTS primac_db
WITH REPLICATION = { 'class' : 'NetworkTopologyStrategy', 'datacenter1' : 2 };