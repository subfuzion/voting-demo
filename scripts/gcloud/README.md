# Creating a GKE Autopilot cluster with gcloud

The following instructions assume you're running a `bash` shell in your
terminal.

Set environment variables as appropriate for PROJECT_ID and REGION. Set
CLUSTER_ID to the name you want to use for your new Autopilot cluster.

```text
export PROJECT_ID=my-project
export REGION=us-central1
export CLUSTER_ID=my-autopilot-cluster-1
```

Create a cluster using GKE Autopilot mode. This operation takes approximately
five minutes.

```text
gcloud container clusters create-auto $CLUSTER_ID \
--project $PROJECT_ID \
--region $REGION
```
