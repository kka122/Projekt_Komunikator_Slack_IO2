import os
import uuid
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_refresh_cookies,
    set_access_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity
)

from db.DataBaseSetupInitialize import setup

load_dotenv('./.env')
load_dotenv('../.env')

post_auth_route = Blueprint("post_auth_route", __name__)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "avatars"))


@post_auth_route.route("/auth/register", methods=["POST"])
def register():
    data = request.form
    saved_avatar_path = None
    try:
        avatar_url = ""
        avatar = request.files.get("avatar")
        if avatar and avatar.filename:
            try:
                os.makedirs(UPLOAD_DIR, exist_ok=True)
                filename = f"{uuid.uuid4().hex}{os.path.splitext(avatar.filename)[1]}"
                saved_avatar_path = os.path.join(UPLOAD_DIR, filename)
                avatar.save(saved_avatar_path)
                avatar_url = f"/api/uploads/avatars/{filename}"
            except OSError as e:
                print(f"[Auth] Blad zapisu avatara: {e}")
                return jsonify({"error": "Nie udalo sie zapisac avatara"}), 500

        try:
            setup.addUser(
                name=data["name"],
                surname=data["surname"],
                email=data["email"],
                password=data["password"],
                avatarUrl=avatar_url,
                googleId=None
            )
        except Exception:
            if saved_avatar_path and os.path.exists(saved_avatar_path):
                try:
                    os.remove(saved_avatar_path)
                except OSError as e:
                    print(f"[Auth] Blad usuwania osieroconego avatara: {e}")
            raise

        access_token = create_access_token(identity=data["email"])
        refresh_token = create_refresh_token(identity=data["email"])

        response = make_response(jsonify({"message": "Rejestracja zakonczona pomyslnie"}), 201)
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response
    except KeyError as e:
        return jsonify({"error": f"Brak pola: {e}"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    except Exception as e:
        print(f"[Auth] Nieoczekiwany blad rejestracji: {e}")
        return jsonify({"error": "Nie udalo sie zarejestrowac uzytkownika"}), 500


@post_auth_route.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = data.get("email")
    password=data.get("password")

    if not email or not password:
        return jsonify({"error": "Email i haslo sa wymagane"}), 400

    if setup.checkUser(email, password):
        access_token = create_access_token(identity=email)
        refresh_token = create_refresh_token(identity=email)

        response = make_response(jsonify({"message": "zalogowano pomyslnie"}), 200)
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response

    return jsonify({"error": "Zly adres email lub haslo"}), 401


@post_auth_route.route("/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()

    new_access_token = create_access_token(identity=current_user)

    response = make_response(jsonify({"message": "Token odswiezony"}), 200)
    set_access_cookies(response, new_access_token)

    return response


@post_auth_route.route("/auth/logout", methods=["POST"])
def logout():
    response = make_response(jsonify({"message": "Wylogowano pomyslnie"}))

    unset_jwt_cookies(response)

    return response, 200