#!/bin/bash
sudo sed -i 's/md5/trust/g' /etc/postgresql/*/main/pg_hba.conf
sudo sed -i 's/scram-sha-256/trust/g' /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql
echo "AUTH DISABLED (TRUST MODE) - SUCCESS"
