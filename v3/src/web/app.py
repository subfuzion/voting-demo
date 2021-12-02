import json
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
# TODO API Driven
election = "Daffy Duck vs Mickey Mouse"
candidates = {
    "daffy": {"id": "daffy", "name": "Daffy Duck", "party": "blue", "color": "#1aaaf8"},
    "mickey": {"id": "mickey", "name": "Mickey Mouse", "party": "green", "color": "#00cbca"}
}
state_county = {
    "California": ["Fresno", "Alameda", "Sacramento"],
    "Arizona": ["La Paz", "Maricopa", "Mohave"],
}


@app.route("/", methods=["GET", "POST"])
def handle_vote():
    voter_id = request.cookies.get("voter_id")
    if not voter_id:
        voter_id = hex(random.getrandbits(64))[2:-1]

    vote = None
    state = ""
    county = ""

    if request.method == "POST":
        vote = request.form["vote"]
        state = request.form["state"] if "state" in request.form else None
        county = request.form["county"] if "county" in request.form else None

        party = candidates[vote]["party"]

        data = {
            "voter": {"voter_id": voter_id, "county": county, "state": state},
            "candidate": {"name": vote, "party": party},
        }
        app.logger.info(f"submit vote: {data}")
        r = requests.post(api + "/vote", json=data)
        app.logger.info(f"vote api: status code: {r.status_code}")

    resp = make_response(
        render_template(
            "index.html",
            election=election,
            candidates=candidates.values(),
            hostname=hostname,
            vote=vote,
            voter_id=voter_id,
            state=state,
            county=county,
        )
    )
    resp.set_cookie("voter_id", voter_id)
    return resp


@app.route("/tally/candidates", methods=["GET"])
def handle_results():
    r = requests.get(api + "/tally/candidates")
    winner, results = process_results(r.json()["results"])

    resp = make_response(
        render_template(
            "tally.html",
            election=election,
            winner=candidates[winner]["name"],
            results=results,
        )
    )
    return resp


def process_results(tallies):
    """
    For candidateTallies, return a winner and the results.
    TODO could the API do this for us?
    """
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
    tally = {}

    # Flatten results of tallies for candidates
    for key in tallies["candidateTallies"]:
        tally[key] = tallies["candidateTallies"][key]["votes"]

    if len(tally) == 0:
        return "No winner yet", {}

    # Sort results in order of votes, desc
    ordered_tally = {
        k: v for k, v in sorted(tally.items(), key=lambda item: item[1], reverse=True)
    }

    # Get highest voted
    winner = max(tally, key=tally.get)
    return winner, ordered_tally


# Powers State dropdown
@app.route("/data/state/", methods=["GET"])
def get_states():
    return make_response(json.dumps(list(state_county.keys())))


# Powers County dropdown
@app.route("/data/state/<state>", methods=["GET"])
def get_counties(state):
    return make_response(json.dumps(state_county[state]))


def handle_signal(sig, frame):
    sigmap = {signal.SIGTERM: "SIGTERM", signal.SIGINT: "SIGINT"}
    if sig in [signal.SIGTERM, signal.SIGINT]:
        print(f"Received signal {sigmap[sig]}, exiting.")
        sys.exit()


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)
    serve(TransLogger(app), host=host, port=port)
