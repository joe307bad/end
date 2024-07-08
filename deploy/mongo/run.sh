#!/bin/bash
set -m

mongodb_cmd="mongod -f /etc/mongod.conf --auth --bind_ip_all --storageEngine wiredTiger"
cmd="$mongodb_cmd"

$cmd &

if [ ! -f /data/db/.mongodb_password_set ]; then
    /set_mongodb_password.sh
fi

fg
