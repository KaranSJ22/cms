#!/bin/bash
set -e

# Default environment variables if not provided
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-RootPassword@123}"
MYSQL_DATABASE="${MYSQL_DATABASE:-CMS_DB}"
MYSQL_USER="${MYSQL_USER:-cms_app}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-StrongPassword@123}"

# Ensure directories exist with proper mysql ownership
mkdir -p /var/lib/mysql /var/run/mysqld
chown -R mysql:mysql /var/lib/mysql /var/run/mysqld
chmod 777 /var/run/mysqld

# Initialize MySQL data directory if not already initialized
if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "=========================================================="
    echo " Initializing MySQL 8.0 on Rocky Linux 9..."
    echo "=========================================================="
    mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql

    echo "=> Starting temporary background MySQL server..."
    mysqld --user=mysql --datadir=/var/lib/mysql --skip-networking --socket=/var/run/mysqld/mysqld.sock &
    pid="$!"

    # Wait for MySQL to become ready
    for i in {30..0}; do
        if mysqladmin ping --socket=/var/run/mysqld/mysqld.sock --silent 2>/dev/null; then
            break
        fi
        echo "=> Waiting for MySQL daemon to respond..."
        sleep 1
    done

    echo "=> Configuring root user, application database, and application user..."
    mysql --socket=/var/run/mysqld/mysqld.sock <<-EOSQL
        -- Set root password for localhost
        ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';

        -- Allow root access from any host within container network
        CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';
        GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

        -- Create application database with UTF8MB4 support
        CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        -- Create application user and grant full permissions to CMS_DB
        CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
        GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%';

        FLUSH PRIVILEGES;
EOSQL

    echo "=> Shutting down temporary MySQL server..."
    mysqladmin --socket=/var/run/mysqld/mysqld.sock -u root -p"${MYSQL_ROOT_PASSWORD}" shutdown
    wait "$pid"
    echo "=> Initial database setup complete."
fi

echo "=========================================================="
echo " Starting MySQL 8.0 on Rocky Linux 9..."
echo "=========================================================="
exec mysqld --user=mysql --datadir=/var/lib/mysql "$@"
