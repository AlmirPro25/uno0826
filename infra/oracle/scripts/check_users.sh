#!/bin/bash
export PGPASSWORD='npg_7nZxI8FpSgYy'
psql 'postgresql://neondb_owner@ep-morning-rain-ackv38c5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require' -c "SELECT id, email, username, role, status FROM users;"
