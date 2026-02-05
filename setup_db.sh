#!/bin/bash
set -e
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'prostqs_secure_pass';"
sudo -u postgres psql -c "CREATE DATABASE prostqs;" || echo "Database prostqs already exists"
echo "listen_addresses = '*'" | sudo tee -a /etc/postgresql/*/main/postgresql.conf
echo "host all all 0.0.0.0/0 md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql
echo "POSTGRESQL INSTALADO E CONFIGURADO COM SUCESSO"
