import os
from flask import Blueprint, request, jsonify
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google.auth import exceptions as google_auth_exceptions
from db.DataBaseSetupInitialize import setup

post_auth_route = Blueprint("post_auth_route", __name__)
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")


@post_auth_route.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    try:
        setup.addUser(
            name=data["name"],
            surname=data["surname"],
            email=data["email"],
            password=data["password"],
            avatarUrl=data.get("avatar", ""),
            googleId=None
        )
        return jsonify({"message": "Rejestracja zakonczona pomyslnie"}), 201
    except KeyError as e:
        return jsonify({"error": f"Brak pola: {e}"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 409


@post_auth_route.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email i haslo sa wymagane"}), 400

    if setup.checkUser(email, password):
        return jsonify({"message": "Zalogowano pomyslnie"}), 200
    return jsonify({"error": "Zly adres email lub haslo"}), 401


@post_auth_route.route("/api/auth/google", methods=["POST"])
def google_auth():
    data = request.get_json(force=True)
    token = data.get("token")

    if not token:
        return jsonify({"error": "Brak tokenu Google"}), 400
    if not GOOGLE_CLIENT_ID:
        return jsonify({"error": "Brak konfiguracji GOOGLE_CLIENT_ID"}), 500

    try:
        payload = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        if payload.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            return jsonify({"error": "Nieprawidlowy issuer tokenu"}), 401

        google_id = payload["sub"]
        email = payload.get("email")
        name = payload.get("given_name", "Google")
        surname = payload.get("family_name", "User")
        avatar = payload.get("picture", "")

        if not email:
            return jsonify({"error": "Token nie zawiera email"}), 401

        _, created = setup.getOrCreateGoogleUser(
            googleId=google_id,
            email=email,
            name=name,
            surname=surname,
            avatarUrl=avatar,
        )
        return jsonify({"message": "Google auth OK", "created": created}), (201 if created else 200)

    except ValueError as e:
        print(f"[GoogleAuth] ValueError: {e}")
        return jsonify({
            "error": "Nieprawidlowy token Google",
            "details": str(e)
        }), 401

    except google_auth_exceptions.TransportError as e:
        print(f"[GoogleAuth] TransportError: {e}")
        return jsonify({
            "error": "Blad polaczenia z Google podczas weryfikacji tokenu"
        }), 503

    except KeyError as e:
        print(f"[GoogleAuth] Missing claim: {e}")
        return jsonify({
            "error": f"Brak pola w tokenie: {e}"
        }), 401

    except Exception as e:
        print(f"[GoogleAuth] Unexpected error: {e}")
        return jsonify({
            "error": "Nieoczekiwany blad podczas logowania Google"
        }), 500
