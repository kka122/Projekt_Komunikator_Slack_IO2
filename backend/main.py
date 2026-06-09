import os, sys
from datetime import timedelta
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from routes.workspace_route import workspace_route

load_dotenv('./.env')
load_dotenv('../.env')

from routes.google_auth_route import google_auth_route
from routes.post_auth_route import post_auth_route

app = Flask(__name__)
CORS(app, supports_credentials=True,
     origins=["http://localhost:5173", "http://localhost:8080", "http://localhost:5001"])

app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-tajny-klucz-zmien-na-produkcji")
app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token"
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Strict"
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

jwt = JWTManager(app)

try:
    app.register_blueprint(post_auth_route)
    app.register_blueprint(google_auth_route)
    app.register_blueprint(workspace_route)
except Exception as blueprintError:
    print(f"Wystapil blad podczas rejestracji blueprinta: {blueprintError}")
    sys.exit(1)

if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(debug=debug, host="0.0.0.0", port=5000)
