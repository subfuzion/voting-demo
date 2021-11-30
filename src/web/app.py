import logging
import os
import random
import signal
import socket

import requests
import sys
from flask import Flask, render_template, request, make_response
from paste.translogger import TransLogger
from prometheus_flask_exporter import PrometheusMetrics
from waitress import serve

app = Flask(__name__)
metrics = PrometheusMetrics(app)
logging.basicConfig(level=logging.DEBUG)

host = os.getenv("HOST", "0.0.0.0")
port = os.getenv("PORT", "8080")
hostname = socket.gethostname()
api = os.getenv("VOTE", "http://vote")

# data for rendering UI
option_a = os.getenv("OPTION_A", "Tabs")
option_b = os.getenv("OPTION_B", "Spaces")


@app.route("/", methods=["GET", "POST"])
def handle_vote():
    voter_id = request.cookies.get("voter_id")
    if not voter_id:
        voter_id = hex(random.getrandbits(64))[2:-1]

    vote = None

    # TODO: update UI and replace mock data with form data
    # (currently only using vote ("a" or "b") for party.
    if request.method == "POST":
        vote = request.form["vote"]
        data = {
            "voter": {
                "voter_id": voter_id,
                "county": "Alameda",
                "state": "California"
            },
            "candidate": {
                "name": "panther",
                "party": vote
            }
        }
        app.logger.info(f"submit vote: {data}")
        r = requests.post(api + "/vote", json=data)
        app.logger.info(f"vote api: status code: {r.status_code}")

    resp = make_response(render_template(
        "index.html",
        option_a=option_a,
        option_b=option_b,
        hostname=hostname,
        vote=vote,
    ))
    resp.set_cookie("voter_id", voter_id)
    return resp


@app.route("/tally/candidates", methods=["GET"])
def handle_results():
    # Expect this shape:
    # {
    #     "candidateTallies": {
    #         "panther": {
    #             "name": "panther",
    #             "votes": 4
    #         },
    #         "tiger": {
    #             "name": "tiger",
    #             "votes": 5
    #         }
    #     }
    # }
    r = requests.get(api + "/tally/candidates")
    resp = make_response(r.json())
    return resp


def handle_signal(sig, frame):
    sigmap = {signal.SIGTERM: "SIGTERM", signal.SIGINT: "SIGINT"}
    if sig in [signal.SIGTERM, signal.SIGINT]:
        print(f"Received signal {sigmap[sig]}, exiting.")
        sys.exit()


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)
    serve(TransLogger(app), host=host, port=port)
