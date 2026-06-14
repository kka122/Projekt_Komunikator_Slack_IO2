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

@direct_chat_route.route("/workspaces/<workspace_id>/direct-chats", methods=["GET"])
@jwt_required()
def list_all_direct_chats(workspace_id):
    user_mail = get_jwt_identity()
    try:
        direct_chats = setup.listAllDirectChats(workspace_id, user_mail)
        return jsonify(direct_chats), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystąpił błąd podczas pobierania czatów: {str(e)}"}), 500
    