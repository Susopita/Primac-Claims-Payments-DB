CREATE KEYSPACE IF NOT EXISTS primac_db
WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };