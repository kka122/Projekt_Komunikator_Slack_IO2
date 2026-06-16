from dotenv import load_dotenv
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from db.DataBaseSetupInitialize import setup

load_dotenv('./.env')
load_dotenv('../.env')

channel_route = Blueprint("channel_route", __name__)

ADMIN_ROLES = ("owner", "admin")


def _require_role(workspaceId, email, allowed_roles=None):
    user = setup.getUserByEmail(email)
    if user is None:
        return None, (jsonify({"error": "Uzytkownik nie istnieje"}), 401)

    if setup.getWorkspaceById(int(workspaceId)) is None:
        return None, (jsonify({"error": "Workspace nie istnieje"}), 404)

    role = setup.getWorkspaceRole(user.id, int(workspaceId))
    if role is None:
        return None, (jsonify({"error": "Brak dostępu do tego workspace"}), 403)

    if allowed_roles is not None and role not in allowed_roles:
        return None, (jsonify({"error": "Brak uprawnień"}), 403)

    return user, None


@channel_route.route("/workspaces/<workspaceId>/channels", methods=["POST"])
@jwt_required()
def create_channel(workspaceId):
    data = request.get_json(silent=True)
    if not data or "name" not in data:
        return jsonify({"error": "Nazwa kanału jest wymagana"}), 400
    channel_name = data["name"].strip()
    if not channel_name:
        return jsonify({"error": "Nazwa kanału nie może być pusta"}), 400

    user_email = get_jwt_identity()
    _, err = _require_role(workspaceId, user_email, ADMIN_ROLES)
    if err:
        return err

    try:
        setup.addChannel(workspaceId=workspaceId, name=channel_name, creatorEmail=user_email)
        return jsonify({"message": "Kanał został pomyślnie utworzony"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas tworzenia kanału: {str(e)}"}), 500


@channel_route.route("/workspaces/<workspaceId>/channels", methods=["GET"])
@jwt_required()
def list_all_channels(workspaceId):
    user_email = get_jwt_identity()
    _, err = _require_role(workspaceId, user_email)
    if err:
        return err

    try:
        channels = setup.listAllChannels(workspaceId=workspaceId, creatorEmail=user_email)
        return jsonify({"channels": channels}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas pobierania kanałów: {str(e)}"}), 500


@channel_route.route("/workspaces/<workspaceId>/channels/<channelId>", methods=["PATCH"])
@jwt_required()
def update_channel_name(workspaceId, channelId):
    data = request.get_json(silent=True)
    if not data or "name" not in data:
        return jsonify({"error": "Nazwa kanału jest wymagana"}), 400
    channel_name = data["name"].strip()
    if not channel_name:
        return jsonify({"error": "Nazwa kanału nie może być pusta"}), 400

    user_email = get_jwt_identity()
    _, err = _require_role(workspaceId, user_email, ADMIN_ROLES)
    if err:
        return err

    try:
        setup.updateChannelName(workspaceId=workspaceId, channelId=channelId, newName=channel_name,
                                updaterEmail=user_email)
        return jsonify({"message": "Nazwa kanału zaktualizowana"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas aktualizacji nazwy kanału: {str(e)}"}), 500


@channel_route.route("/workspaces/<workspaceId>/channels/<channelId>", methods=["DELETE"])
@jwt_required()
def delete_channel(workspaceId, channelId):
    user_email = get_jwt_identity()
    _, err = _require_role(workspaceId, user_email, ADMIN_ROLES)
    if err:
        return err

    try:
        setup.deleteChannel(workspaceId=workspaceId, channelId=channelId, creatorEmail=user_email)
        return jsonify({"message": "Kanał został usunięty"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas usuwania kanału: {str(e)}"}), 500

@channel_route.route("/workspaces/<workspaceId>/channels/<channelId>/read", methods=["POST"])
@jwt_required()
def mark_channel_read(workspaceId, channelId):
    user_email = get_jwt_identity()
    try:
        setup.markChannelRead(workspaceId=workspaceId, channelId=channelId, userEmail=user_email)
        return jsonify({"message": "Oznaczono jako przeczytane"}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except (ValueError, LookupError) as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd: {str(e)}"}), 500
