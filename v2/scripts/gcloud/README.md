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

Authorize `gcloud` to use your Google user credentials.

```text
gcloud auth login
```

Create a cluster using GKE Autopilot mode. The following two operations will
take approximately ten minutes to complete.

```text
gcloud beta container clusters create-auto $CLUSTER_ID \
--project $PROJECT_ID \
--region $REGION \
--monitoring=SYSTEM,WORKLOAD

gcloud beta container clusters update $CLUSTER_ID \
--project $PROJECT_ID \
--region $REGION \
--monitoring=SYSTEM,WORKLOAD
```

> **Note:** To enable GKE Workload Metrics, which is currently in Public
> Preview, we need to use the `beta container clusters create-auto` command,
> followed by the `container beta clusters update` command.
> 
> Once the feature is Generally Available (GA), workload metrics will be enabled
> by default for Autopilot clusters. You will then only need this command:
> 
> gcloud container clusters create-auto $CLUSTER_ID \
> --project $PROJECT_ID \
> --region $REGION
