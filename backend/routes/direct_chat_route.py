from dotenv import load_dotenv
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from db.DataBaseSetupInitialize import setup

load_dotenv('./.env')
load_dotenv('../.env')

direct_chat_route = Blueprint("direct_chat_route", __name__)

@direct_chat_route.route("/workspaces/<workspaceId>/direct-chats", methods=["GET"])
@jwt_required()
def list_all_direct_chats(workspaceId):
    user_mail = get_jwt_identity()
    try:
        direct_chats = setup.listAllDirectChats(workspaceId, user_mail)
        return jsonify({"directChats": direct_chats}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas pobierania czatów: {str(e)}"}), 500

@direct_chat_route.route("/workspaces/<workspaceId>/direct-chats", methods=["POST"])
@jwt_required()
def create_direct_chat(workspaceId):
    user_mail = get_jwt_identity()
    data = request.get_json(force=True, silent=True) or {}
    other_user_id = data.get("userId")
    if not other_user_id:
        return jsonify({"error": "Brak userId"}), 400
    try:
        chat = setup.getOrCreateDirectChat(workspaceId, user_mail, other_user_id)
        return jsonify(chat), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas tworzenia czatu: {str(e)}"}), 500

@direct_chat_route.route("/workspaces/<workspaceId>/direct-chats/<directChatId>/read", methods=["POST"])
@jwt_required()
def mark_direct_chat_read(workspaceId, directChatId):
    user_mail = get_jwt_identity()
    try:
        setup.markDirectChatRead(workspaceId, directChatId, user_mail)
        return jsonify({"message": "Oznaczono jako przeczytane"}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except (ValueError, LookupError) as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd: {str(e)}"}), 500
