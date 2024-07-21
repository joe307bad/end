#!/bin/bash
set -m

openssl rand -base64 756 > /mongodb.key

chmod 600 /mongodb.key
chmod -R 600 /var/lib/mongodb/

mongodb_cmd="/usr/bin/mongod --replSet rs0 --keyFile /mongodb.key --auth --bind_ip_all --dbpath /var/lib/mongodb/ --storageEngine wiredTiger"
cmd="$mongodb_cmd"

$cmd &

if [ ! -f /var/lib/mongodb/.mongodb_password_set ]; then
    /set_mongodb_password.sh
fi

fg
