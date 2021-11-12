# Shell script to set up a managed DB in Cloud SQL
if [ -z ${1+x} ]; then
    echo You need to pass in the instance name you want as the first argument
fi

instance_name=$1
# If the database name changes, it will have to also be changed in the rest of
# the node scripts of the main application
db_name="election_data"

if ! gcloud --version &> /dev/null; then
    echo gcloud is not installed, please install before proceeding.
    exit 1
fi

echo Creating Cloud SQL instance, this will take several minutes...

# IF we need the IP address for some reason (we should only need connection name) then uncomment the next two lines and comment out the gcloud sql create line
#db_ip=$(gcloud sql instances create $instance_name --database-version=POSTGRES_13 --cpu=2 --memory=4GiB --region=us-central1 --root-password=$PGPASSWORD | sed -n "s/.* \([0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\) .*/\1/p")
#echo Instance created with IP: $db_ip

gcloud sql instances create $instance_name --database-version=POSTGRES_13 --cpu=2 --memory=4GiB --region=us-central1 --root-password=$PGPASSWORD
instance_conn_name=$(gcloud sql instances describe $instance_name | grep connectionName | cut -f2 -d " ")
echo Instance connection name: $instance_conn_name

# Since we're not authorizing any networks, we'll use the proxy to connect so we need
# the connection name.
# TODO: decide if we want to do private IP instead, which means altering the above
# create command to no assign IP, as well as set the network to be sure it creates a 
# private IP on the instance.
echo Fetching the cloud sql proxy

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        proxy_path=https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
elif [[ "$OSTYPE" == "darwin"* ]]; then
        proxy_path=https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
fi

if ! wget $proxy_path -O cloud_sql_proxy; then
    echo Unable to fetch the cloud sql proxy
    rm cloud_sql_proxy
    exit 1
fi
chmod +x cloud_sql_proxy
port=5445

# This script assumes it's being run in an environment running a service account
# that has Cloud SQL connection permissions so that the proxy can pick it up
# This means either a manual auth has been run, it's in a container assigned a
# service account with that permission, etc.
./cloud_sql_proxy --instances=$instance_conn_name=tcp:$port &
proxy_pid=$!

# Wait for a few seconds to give the proxy a chance to get going
# First startup on MacOS is...slow, so leaving 10 seconds
sleep 10

if ! psql -h localhost -U $PGUSER -d postgres -p $port -c "CREATE DATABASE $db_name;"; then
    echo Could not create the database
    exit 1
fi

if ! psql -h localhost -U $PGUSER -d $db_name -p $port -c "CREATE TABLE president_county_candidate (state TEXT, county TEXT, candidate TEXT, party TEXT, total_votes NUMERIC, won BOOLEAN);"; then
    echo Could not create the table
    exit 1
fi

echo Importing election data...
if ! psql -h localhost -U $PGUSER -d $db_name -p $port -c "\copy president_county_candidate FROM './president_county_candidate.csv' DELIMITER ',' CSV HEADER;"; then
    echo Could not import our presidential data
    exit 1
fi

echo Shutting down proxy
kill $proxy_pid

# finally, clean up our workspace and get rid of the proxy
rm cloud_sql_proxy

echo Cloud SQL instance fully set up!
