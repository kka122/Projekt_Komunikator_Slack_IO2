import os, sys, re
from datetime import timedelta
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv('./.env')
load_dotenv('../.env')

from routes.direct_chat_route import direct_chat_route
from routes.workspace_route import workspace_route
from routes.auth_route.google_auth_route import google_auth_route
from routes.auth_route.post_auth_route import post_auth_route
from routes.message_route import message_route
from routes.channel_route import channel_route
from routes.user_route import user_route

app = Flask(__name__)
CORS(app, supports_credentials=True,
     origins=re.compile(r"http://localhost(:\d+)?$"))

app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token"
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Strict"
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

jwt = JWTManager(app)

try:
    app.register_blueprint(post_auth_route, url_prefix="/api")
    app.register_blueprint(google_auth_route, url_prefix="/api")
    app.register_blueprint(workspace_route, url_prefix="/api")
    app.register_blueprint(message_route, url_prefix="/api")
    app.register_blueprint(channel_route, url_prefix="/api")
    app.register_blueprint(direct_chat_route, url_prefix="/api")
    app.register_blueprint(user_route, url_prefix="/api")
except Exception as blueprintError:
    print(f"Wystapil blad podczas rejestracji blueprinta: {blueprintError}")
    sys.exit(1)

if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(debug=debug, host="0.0.0.0", port=5000)

