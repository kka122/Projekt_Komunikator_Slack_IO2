import os

from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, make_response
from google.auth import exceptions as google_auth_exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from flask_jwt_extended import create_access_token, create_refresh_token, set_refresh_cookies
from db.DataBaseSetupInitialize import setup

load_dotenv('./.env')
load_dotenv('../.env')

google_auth_route = Blueprint("google_auth_route", __name__)
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_AUTH_CLIENT_ID")


@google_auth_route.route("/auth/google", methods=["POST"])
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

        access_token = create_access_token(identity=email)
        refresh_token = create_refresh_token(identity=email)

        response = make_response(jsonify({
            "message": "Google auth OK",
            "created": created,
            "access_token": access_token
        }))

        set_refresh_cookies(response, refresh_token)

        status_code = 201 if created else 200
        return response, status_code

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
