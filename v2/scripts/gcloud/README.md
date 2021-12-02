# Creating a GKE Autopilot cluster with gcloud

The following instructions assume you're running a `bash` shell in your
terminal.

Set environment variables as appropriate for PROJECT_ID and REGION. Set
CLUSTER_ID to the name you want to use for your new Autopilot cluster.

```text
export PROJECT_ID=autopilot-demo
export REGION=us-central1
export CLUSTER_ID=autopilot-demo-cluster-v2
```

Authorize `gcloud` to use your Google user credentials.

```text
gcloud auth login
```

Create a cluster using GKE Autopilot mode. The following operation will take
approximately five minutes to complete.

```text
gcloud container clusters create-auto $CLUSTER_ID \
--project $PROJECT_ID \
--region $REGION
```
