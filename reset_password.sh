#!/bin/bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'prostqs_secure_pass';"
echo "PASSWORD RESET SUCCESS"
