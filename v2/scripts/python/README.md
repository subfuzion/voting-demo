# Creating a GKE Autopilot cluster with Python

Use Python 3.6 or later.

Run commands from within the `./scripts/python` directory.

```text
cd ./scripts/python
```

## Set up your Python environment

Set up a virtual environment in the `./scripts/python` directory.

```text
python3 -m venv venv
source venv/bin/activate
```

Install package dependencies.

```text
pip install -r requirements.txt
```

## Set up your cloud environment

Set environment variables as appropriate for PROJECT_ID and REGION. Set
CLUSTER_ID to the name you want to use for your new Autopilot cluster.

```text
export PROJECT_ID=my-project
export REGION=us-central1
export CLUSTER_ID=my-autopilot-cluster-1
```

Authorize the Python script with Application Default Credentials (ADC) and, if
prompted, add the project to ADC as a quota project.

```text
gcloud auth application-default login
gcloud auth application-default set-quota-project $PROJECT_ID
```

## Create a cluster

This following operation takes approximately five minutes.

```text
python create_cluster.py
```

Sample output:

```text
creating cluster:
......................................................................................................
cluster provisioning time: 0:05:27.289861
```
