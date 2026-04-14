import os,sys
from flask import Flask
from routes.post_auth_route import post_auth_route
from flask_cors import CORS
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173","http://localhost:8080","http://localhost:5001"])

try:
    app.register_blueprint(post_auth_route)
except Exception as blueprintError:
    print(f"Wystapil blad podczas rejestracji blueprinta: {blueprintError}")
    sys.exit(1)
    
if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, host="0.0.0.0", port=5000)
