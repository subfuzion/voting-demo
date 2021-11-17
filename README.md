# Voting demo

Simple voting app that consists of two services:

 - frontend (Node.js service)
 - database (MongoDB database)

If you prefer demo apps with more microservices (but take a bit
longer to start), try these out:

 - https://github.com/GoogleCloudPlatform/microservices-demo
 - https://github.com/GoogleCloudPlatform/bank-of-anthos

## Quickstart (GKE)

### Create an Autopilot cluster

You will need a Google Cloud project with billing enabled.

Follow the instructions for using either [gcloud](./scripts/gcloud) or
[Python](./scripts/python) to create an Autopilot cluster.

### Build and deploy the app

You will need to install Skaffold on your system. This tool uses a file
([./skaffold.yaml](./skaffold.yaml)) that configures the build and deploy tasks
for the application:

- Application components will be built on Google Cloud using Cloud Build so
  that you won't need to install any other tools, including Docker, on your 
  own system.
- The application will be deployed to the GKE Autopilot cluster you created 
  previously.


1. **Install Skaffold on your system**

Install [Skaffold for CLI](https://skaffold.dev/).

2. **Use scaffold to run the deployment**

Ensure the following environment variables are set:

- PROJECT_ID set to your project
- CLUSTER_ID set to your cluster

```text
export PROJECT_ID=my-project
export CLUSTER_ID=my-cluster
```

Get authorization to access your project.

```text
gcloud auth login
```

Get Kubernetes credentials for the GKE cluster in your project.

```text
gcloud container clusters get-credentials \
--project $PROJECT_ID \
--region $REGION \
$CLUSTER_ID
```

Run the following `skaffold` command. You may be prompted to enable various
APIs, such as Cloud Build.

```text
skaffold run --default-repo=gcr.io/$PROJECT_ID/voting-app --tail
```

## Test the app

Use the following commands to get the public address of the app.

```text
IP=$(kubectl get service frontend-external -o jsonpath="{.status.loadBalancer.ingress[0].ip}{'\n'}")
FRONTEND="http://${IP}:80"
```

**Cast votes (choose either `a` or `b`).**

```text
curl "$FRONTEND/vote" -H "Content-Type: application/json" -d '{"vote":"a"}'
```

Sample output:

```text
{"success":true,"data":{"vote":"a","voter_id":"82f027eb-c25b-480d-aa20-9d3d727544a5"}}
```

**Fetch the current voting results.**

```text
curl "$FRONTEND/results"
```

Sample output:

```text
{"success":true,"results":{"a":1,"b":0}}
```

## Clean up

```text
skaffold delete
```
