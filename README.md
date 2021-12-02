# Voting App

This repo contains a simple voting application. The purpose of this repo is to
demonstrate how to:

- use Docker during development
- use Autopilot to create a Google-managed cluster on GKE for hosting the app
- create configuration for deploying the application to Kubernetes
- use developer tools that make it easy to deploy to GKE and monitor
  logs from an IDE
- monitor application performance (logs and metrics) using the Cloud Console.

The application developer journey starts with a basic version that evolves over
several versions.

- [v1](./v1) contains two services:
  - `frontend` - voting API (Node.js)
  - `backend` - database (MongoDB)
- [v2](./v2) restructures the app to three services:
  - `web` - web UI (using Python / Flask app)
  - `vote` - voting API (Node.js)
  - `database` - database (MongoDB)
- [v3](./v2) updates the web UI and uses a relational database:
  - `web` - web UI (using Python / Flask app)
  - `vote` - voting API (Node.js)
  - `database` - database (Postgres)
