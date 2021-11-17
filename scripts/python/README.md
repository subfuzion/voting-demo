# Creating an Autopilot cluster with Python

Use Python 3.6 or later.

Run commands from within the `./scripts/python` directory.

```text
cd ./scripts/python
```

Set up a virtual environment in the `./scripts/python` directory.

```text
python3 -m venv venv
source venv/bin/activate
```

Install package dependencies.

```text
pip install -r requirements.txt
```

Create a cluster. Set environment variables as appropriate for PROJECT_ID and
REGION. Set CLUSTER_ID to the name you want to use for your new Autopilot
cluster.

```text
export PROJECT_ID=my-project
export REGION=us-central1
export CLUSTER_ID=my-autopilot-cluster-1

python create_cluster.py
```

Sample output:

```text
creating cluster:
......................................................................................................
cluster provisioning time: 0:05:27.289861
```
