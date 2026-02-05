#!/bin/bash
echo "host all all 64.181.175.25/32 trust" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf
sudo systemctl reload postgresql
echo "ADDED TRUST FOR ORACLE IP"
