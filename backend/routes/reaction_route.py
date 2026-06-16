from dotenv import load_dotenv
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from db.DataBaseSetupInitialize import setup
from realtime import events as rt

load_dotenv('./.env')
load_dotenv('../.env')

reaction_route = Blueprint("reaction_route", __name__)


@reaction_route.route("/workspaces/<workspaceId>/channels/<channelId>/messages/<messageId>/reactions", methods=["POST"])
@jwt_required()
def add_reaction_to_channel_message(workspaceId, channelId, messageId):
    user_email = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    emoji = data.get("emoji")
    try:
        reaction = setup.addReactionChannel(workspaceId, channelId, messageId, emoji, user_email)
        rt.channel_reaction_added(workspaceId, channelId, messageId, reaction)
        return jsonify(reaction), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas dodawania reakcji: {str(e)}"}), 500


@reaction_route.route("/workspaces/<workspaceId>/channels/<channelId>/messages/<messageId>/reactions/<reactionId>", methods=["DELETE"])
@jwt_required()
def remove_reaction_from_channel_message(workspaceId, channelId, messageId, reactionId):
    user_email = get_jwt_identity()
    try:
        setup.deleteReactionChannel(workspaceId, channelId, messageId, reactionId, user_email)
        rt.channel_reaction_removed(workspaceId, channelId, messageId, reactionId)
        return jsonify({"message": "Reakcja zostala usunieta"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas usuwania reakcji: {str(e)}"}), 500


@reaction_route.route("/workspaces/<workspaceId>/direct-chats/<directChatId>/messages/<messageId>/reactions", methods=["POST"])
@jwt_required()
def add_reaction_to_direct_chat_message(workspaceId, directChatId, messageId):
    user_email = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    emoji = data.get("emoji")
    try:
        reaction = setup.addReactionChat(workspaceId, directChatId, messageId, emoji, user_email)
        rt.dm_reaction_added(workspaceId, directChatId, messageId, reaction)
        return jsonify(reaction), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas dodawania reakcji: {str(e)}"}), 500


@reaction_route.route("/workspaces/<workspaceId>/direct-chats/<directChatId>/messages/<messageId>/reactions/<reactionId>", methods=["DELETE"])
@jwt_required()
def remove_reaction_from_direct_chat_message(workspaceId, directChatId, messageId, reactionId):
    user_email = get_jwt_identity()
    try:
        setup.deleteReactionChat(workspaceId, directChatId, messageId, reactionId, user_email)
        rt.dm_reaction_removed(workspaceId, directChatId, messageId, reactionId)
        return jsonify({"message": "Reakcja zostala usunieta"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas usuwania reakcji: {str(e)}"}), 500
