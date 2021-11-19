import json
import logging
import os
import random
import requests
import socket

from flask import Flask, render_template, request, make_response
from paste.translogger import TransLogger
from waitress import serve

app = Flask(__name__)
app.logger = logging.getLogger("app")
app.logger.setLevel(logging.INFO)

# data for rendering UI
option_a = os.getenv("OPTION_A", "Tabs")
option_b = os.getenv("OPTION_B", "Spaces")

host = os.getenv("HOST", "0.0.0.0")
port = os.getenv("PORT", "8080")
hostname = socket.gethostname()
api = os.getenv("API", "http://api:8080")


@app.route("/", methods=["GET", "POST"])
def handle_vote():
    voter_id = request.cookies.get("voter_id")
    if not voter_id:
        voter_id = hex(random.getrandbits(64))[2:-1]

    vote = None

    if request.method == "POST":
        vote = request.form["vote"]
        data = {"voter_id": voter_id, "vote": vote}
        app.logger.info(data)
        r = requests.post(api + "/vote", json=data)

        app.logger.info(f"status code: {r.status_code}")
        print(r, flush=True)
        print('----------')

    resp = make_response(render_template(
        "index.html",
        option_a=option_a,
        option_b=option_b,
        hostname=hostname,
        vote=vote,
    ))
    resp.set_cookie("voter_id", voter_id)
    return resp


if __name__ == "__main__":
    display_host = "" if host == "0.0.0.0" else host
    print(f"serving on {display_host}:{port}", flush=True)
    serve(TransLogger(app), host=host, port=port)
