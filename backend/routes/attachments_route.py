import os

from dotenv import load_dotenv
from flask import Blueprint, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from db.DataBaseSetupInitialize import setup

load_dotenv('./.env')
load_dotenv('../.env')

attachments_route = Blueprint("attachments_route", __name__)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "attachments"))


def _handle_error(e, action):
    if isinstance(e, PermissionError):
        return jsonify({"error": str(e)}), 403
    if isinstance(e, LookupError):
        return jsonify({"error": str(e)}), 404
    if isinstance(e, ValueError):
        return jsonify({"error": str(e)}), 400
    print(f"[Attachment] {action}: {e}")
    return jsonify({"error": f"{action}: {str(e)}"}), 500


def _remove_file(file_url):
    if not file_url:
        return
    stored_name = os.path.basename(file_url)
    full_path = os.path.join(UPLOAD_DIR, stored_name)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError as e:
            print(f"[Attachment] Blad usuwania pliku {full_path}: {e}")


@attachments_route.route(
    "/workspaces/<workspaceId>/channels/<channelId>/messages/<messageId>/attachments/<attachmentId>",
    methods=["DELETE"],
)
@jwt_required()
def delete_channel_message_attachment(workspaceId, channelId, messageId, attachmentId):
    email = get_jwt_identity()
    try:
        file_url = setup.deleteAttachmentChannel(
            workspaceId=workspaceId,
            channelId=channelId,
            messageId=messageId,
            attachmentId=attachmentId,
            requesterEmail=email,
        )
        _remove_file(file_url)
        return jsonify({"message": "Zalacznik usuniety"}), 200
    except Exception as e:
        return _handle_error(e, "Nie udalo sie usunac zalacznika")


@attachments_route.route(
    "/workspaces/<workspaceId>/direct-chats/<directChatId>/messages/<messageId>/attachments/<attachmentId>",
    methods=["DELETE"],
)
@jwt_required()
def delete_direct_chat_message_attachment(workspaceId, directChatId, messageId, attachmentId):
    email = get_jwt_identity()
    try:
        file_url = setup.deleteAttachmentChat(
            workspaceId=workspaceId,
            directChatId=directChatId,
            messageId=messageId,
            attachmentId=attachmentId,
            requesterEmail=email,
        )
        _remove_file(file_url)
        return jsonify({"message": "Zalacznik usuniety"}), 200
    except Exception as e:
        return _handle_error(e, "Nie udalo sie usunac zalacznika")