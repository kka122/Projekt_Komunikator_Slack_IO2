from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_refresh_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity
)

from db.DataBaseSetupInitialize import setup

load_dotenv('./.env')
load_dotenv('../.env')

post_auth_route = Blueprint("post_auth_route", __name__)


@post_auth_route.route("/auth/register", methods=["POST"])
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


@post_auth_route.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email i haslo sa wymagane"}), 400

    if setup.checkUser(email, password):
        access_token = create_access_token(identity=email)
        refresh_token = create_refresh_token(identity=email)

        response = make_response(jsonify({
            "message": "Zalogowano pomyslnie",
            "access_token": access_token
        }))

        set_refresh_cookies(response, refresh_token)

        return response, 200

    return jsonify({"error": "Zly adres email lub haslo"}), 401


@post_auth_route.route("/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()

    new_access_token = create_access_token(identity=current_user)

    return jsonify({"access_token": new_access_token}), 200


@post_auth_route.route("/auth/logout", methods=["POST"])
def logout():
    response = make_response(jsonify({"message": "Wylogowano pomyslnie"}))

    unset_jwt_cookies(response)

    return response, 200
