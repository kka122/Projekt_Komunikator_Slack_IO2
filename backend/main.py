from flask import Flask
from flask_cors import CORS
from waitress import serve
from routes.post_auth_route import post_auth_route

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:6000", "http://localhost:6173"])
app.register_blueprint(post_auth_route)


if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=5000, threads=8)

