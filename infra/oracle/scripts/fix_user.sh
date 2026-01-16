#!/bin/bash
export PGPASSWORD='npg_7nZxI8FpSgYy'

# Criar usuário na tabela users com o ID da sovereign_identity
# para almir@prostqs.com.br
psql 'postgresql://neondb_owner@ep-morning-rain-ackv38c5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require' -c "
INSERT INTO users (id, email, username, role, status, version, created_at, updated_at)
VALUES (
  '4b77a827-dce0-40ff-bf17-2af02192c9f4',
  'almir@prostqs.com.br',
  'almir@prostqs.com.br',
  'super_admin',
  'active',
  1,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET role = 'super_admin', updated_at = NOW();
"

echo "=== VERIFICANDO ==="
psql 'postgresql://neondb_owner@ep-morning-rain-ackv38c5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require' -c "SELECT id, email, role, status FROM users WHERE email = 'almir@prostqs.com.br';"
