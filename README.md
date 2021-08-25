# Voting demo

Simple voting app that consists of two services:

 - frontend (Node.js service)
 - database (MongoDB database)

If you prefer demo apps with more microservices (but take a bit
longer to start), try these out:

 - https://github.com/GoogleCloudPlatform/microservices-demo
 - https://github.com/GoogleCloudPlatform/bank-of-anthos

## Set up the Google Cloud project

Set the project ID and cluster name environment variables. You can use
existing resources or else create new ones in the following steps.

```text
PROJECT_ID=autopilot-demo
CLUSTER_NAME=autopilot-demo-cluster
```

Create a custom gcloud configuration for this demo and log in.

```text
gcloud config configurations create $PROJECT_ID
gcloud config set project $PROJECT_ID
gcloud auth login
```

### If you need to create the project

If the project doesn't exist, create it and link billing. You can find the billing
account ID here: https://console.cloud.google.com/billing.

```text
gcloud projects create $PROJECT_ID
gcloud beta billing projects link $PROJECT_ID --billing-account=XXXXXX-XXXXXX-XXXXXX
```

### Ensure required Google APIS are enabled

```text
gcloud services enable \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com \
  containerregistry.googleapis.com \
  monitoring.googleapis.com
```

## Create an Autopilot cluster

Choose a [region](https://cloud.google.com/compute/docs/regions-zones).
You don't need to select zones because Autopilot will automatically
select zones in the region to ensure availability.

```text
gcloud config set compute/region us-central1
```

Create the cluster in Autopilot mode.

```text
gcloud container clusters create-auto $CLUSTER_NAME
```

This may take a little longer than you're used to with Standard mode because
Google automatically applies recommendations for availability and security to
clusters created in Autopilot mode.

## Deploy the demo

Add the `frontend` service image to container registry for your project.

```text
cd src/frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/frontend:latest
cd -
```

> HACK: for now, manually edit line 18 of `kubernetes/frontend.yaml` and
> replace PROJECT_ID as appropriate.

```text
18:          image: gcr.io/PROJECT_ID/frontend:latest
```

Deploy the app.

```text
kubectl apply -f kubernetes/
```

Once the app is deployed, get the external IP.

```text
kubectl get service frontend-external -o jsonpath="{.status.loadBalancer.ingress[0].ip}{'\n'}"
```

## Test the app

Using the IP value from the previous step, set the following environment
variable with the correct value for IP.

```text
FRONTEND="http://IP:80"
```

Or, you can run the following to do the substitution.

```text
IP=$(kubectl get service frontend-external -o jsonpath="{.status.loadBalancer.ingress[0].ip}{'\n'}")
FRONTEND="http://${IP}:80"
```

Cast multiple votes (choose either `a` or `b`).

```text
curl "$FRONTEND/vote" -H "Content-Type: application/json" -d '{"vote":"a"}'
```

Sample output:

```text
{"success":true,"data":{"vote":"a","voter_id":"82f027eb-c25b-480d-aa20-9d3d727544a5"}}
```

Fetch the current voting results.

```text
curl "$FRONTEND/results"
```

Sample output:

```text
{"success":true,"results":{"a":1,"b":0}}
```

## Clean up

### Delete resources

To just delete the demo:

```text
kubectl delete -f kubernetes/
```

To delete the cluster:

```text
gcloud container clusters delete $CLUSTER_NAME
```

To delete the entire project (including all resources):

```text
gcloud projects delete $PROJECT_ID
```

### Delete custom configuration

```text
gcloud config configurations delete $PROJECT_ID
```