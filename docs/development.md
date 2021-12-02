# Development Guide

This document describes how to develop and add features to the Voting Demo
application in your local environment.

## Prerequisites

1. [A GCP project](https://cloud.google.com/resource-manager/docs/creating-managing-projects#console)
   , connected to your billing account.
2. [A GKE Autopilot cluster in your project](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-an-autopilot-cluster)
   . In each variation directory (`v1`, `v2`, etc), you can find instructions
   for using Bash or Python under the `scripts` subdirectory.

## Install Tools

You can use MacOS or Linux for your dev environment. Developing under Windows
has not been tested.

1. [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install)
3. [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) (can be
   installed separately or via [gcloud](https://cloud.google.com/sdk/install))
4. [skaffold **1.34+**](https://skaffold.dev/docs/install/) (latest version
   recommended)
8. [Python3](https://www.python.org/downloads/)
9. [piptools](https://pypi.org/project/pip-tools/)

## Adding External Packages

### Python

If you're adding a new feature that requires a new external Python package in
one or more services (`frontend`, `contacts`, `userservice`), you must
regenerate the `requirements.txt` file using `piptools`. This is what the Python
Dockerfiles use to install external packages inside the containers.

To add a package:

1. Add the package name to `requirements.in` within the `src/<service>`
   directory:

2. From inside that directory, run:

```
python3 -m pip install pip-tools
python3 -m piptools compile --output-file=requirements.txt requirements.in
```

3. Re-run `skaffold dev` or `skaffold run` to trigger a Docker build using the
   updated `requirements.txt`.

# TODO

### Node.js

## Testing your changes locally

### Running services selectively

## Continuous Integration
