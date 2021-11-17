import os
import time
from datetime import datetime

import asyncio
from google.cloud import container_v1beta1 as container

# Cluster creation takes minutes, so a low res timer is fine.
start = datetime.now()

Status = container.types.cluster_service.Cluster.Status


def getenv(key):
    val = os.getenv(key)
    if not val:
        print("error: environment variable not set:", key)
        exit(1)
    return val


async def wait_for_cluster(cluster_manager, name, status=Status.RUNNING):
    req = container.types.GetClusterRequest()
    req.name = name
    cluster = await cluster_manager.get_cluster(req)
    cur_status = cluster.status
    while cur_status != status.value:
        print(".", end="", flush=True)
        time.sleep(3)
        cluster = await cluster_manager.get_cluster(req)
        cur_status = cluster.status
    print()


async def main():
    cluster_manager = container.ClusterManagerAsyncClient()

    name = f"projects/{project_id}/locations/{region}/clusters/{cluster_id}"

    # Use the following approach instead for IDE completion support.
    request = container.types.CreateClusterRequest()
    request.parent = f"projects/{project_id}/locations/{region}"
    request.cluster = container.types.Cluster()
    request.cluster.name = cluster_id
    request.cluster.autopilot = container.types.Autopilot()
    request.cluster.autopilot.enabled = True

    # Same as the above if literal style preferred (and don't care about IDE completion support).
    # request = {
    #     "parent": f"projects/{project_id}/locations/{region}",
    #     "cluster": {
    #         "name": cluster_id,
    #         "autopilot": {
    #             "enabled": True
    #         },
    #     }
    # }

    print("creating cluster:")
    await cluster_manager.create_cluster(request=request)
    await wait_for_cluster(cluster_manager, name)


project_id = getenv("PROJECT_ID")
region = getenv("REGION")
cluster_id = getenv("CLUSTER_ID")

asyncio.run(main())
end = datetime.now()
print('cluster provisioning time:', end - start)
