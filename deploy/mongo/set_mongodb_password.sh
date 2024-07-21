#!/bin/bash

# Admin User
MONGODB_ADMIN_USER=${MONGODB_ADMIN_USER:-"admin"}
MONGODB_ADMIN_PASS=${MONGODB_ADMIN_PASS:-"4dmInP4ssw0rd"}

# Wait for MongoDB to boot
RET=1
while [[ RET -ne 0 ]]; do
    echo "=> Waiting for confirmation of MongoDB service startup..."
    sleep 5
    mongosh --version
    mongosh --eval "help"
    mongosh --eval "help" > /dev/null 2>&1
    RET=$?
done

# Initialize the replica set
echo "=> Initialize the replica set"
mongosh --eval "rs.initiate({ _id: 'rs0', members: [ {_id: 0, host: 'localhost'}] })"
mongosh --eval "rs.status()"

# Create the admin user
echo "=> Creating admin user with a password in MongoDB"
mongosh --eval "db.adminCommand({createUser: '$MONGODB_ADMIN_USER', pwd: '$MONGODB_ADMIN_PASS', roles:[{role:'root',db:'admin'}]});"

sleep 3

# If everything went well, add a file as a flag so we know in the future to not re-create the
# users if we're recreating the container (provided we're using some persistent storage)
echo "=> Done!"
touch /var/lib/mongodb/.mongodb_password_set

echo "========================================================================"
echo "You can now connect to the admin MongoDB server using:"
echo ""
echo "    mongosh -u $MONGODB_ADMIN_USER -p $MONGODB_ADMIN_PASS --host <host> --port <port>"
echo ""
echo "Please remember to change the admin password as soon as possible!"
echo "========================================================================"
