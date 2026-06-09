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


@channel_route.route("/api/workspaces/<workspaceId>/channels", methods=["POST"])
@jwt_required()
def create_channel(workspaceId):
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "Nazwa kanału jest wymagana"}), 400
    channel_name = data["name"].strip()
    if not channel_name:
        return jsonify({"error": "Nazwa kanału nie może być pusta"}), 401
    user_email = get_jwt_identity()
    try:
        setup.addChannel(workspaceId=workspaceId, channelName=channel_name, creatorEmail=user_email)
        return jsonify({"message": "Kanał został pomyślnie utworzony)"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 402
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas tworzenia kanału: {str(e)}"}), 500


@channel_route.route("/api/workspaces/<workspaceId>/channels", methods=["GET"])
@jwt_required()
def list_all_channels(workspaceId):
    user_email = get_jwt_identity()
    try:
        channels = setup.listAllChannels(workspaceId=workspaceId, creatorEmail=user_email)
        return jsonify([channel.to_dict() for channel in channels]), 200
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas pobierania kanałów: {str(e)}"}), 500


@channel_route.route("/api/workspaces/<workspaceId>/channels/<channelId>", methods=["PATCH"])
@jwt_required()
def update_channel_name(workspaceId, channelId):
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "Nazwa kanału jest wymagana"}), 400
    channel_name = data["name"].strip()
    user_email = get_jwt_identity()
    try:
        setup.updateChannelName(workspaceId=workspaceId, channelId=channelId, newName=channel_name,
                                updaterEmail=user_email)
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas aktualizacji nazwy kanału: {str(e)}"}), 500


@channel_route.route("api/workspaces/<workspaceId>/channels/<channelId>", methods=["DELETE"])
@jwt_required()
def delete_channel(workspaceId, channelId):
    user_email = get_jwt_identity()
    try:
        setup.deleteChannel(workspaceId=workspaceId, channelId=channelId, creatorEmail=user_email)
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas usuwania kanału:{str(e)}"}), 500
