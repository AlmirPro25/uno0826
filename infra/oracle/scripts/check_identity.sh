#!/bin/bash
export PGPASSWORD='npg_7nZxI8FpSgYy'
echo "=== SOVEREIGN IDENTITIES ==="
psql 'postgresql://neondb_owner@ep-morning-rain-ackv38c5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require' -c "SELECT user_id, primary_phone, source FROM sovereign_identities;"
echo ""
echo "=== FEDERATED IDENTITIES ==="
psql 'postgresql://neondb_owner@ep-morning-rain-ackv38c5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require' -c "SELECT user_id, provider, email FROM federated_identities;"
echo ""
echo "=== USERS ==="
psql 'postgresql://neondb_owner@ep-morning-rain-ackv38c5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require' -c "SELECT id, email, role, status FROM users;"
