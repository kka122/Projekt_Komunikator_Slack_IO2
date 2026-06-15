import os
import uuid

from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from db.DataBaseSetupInitialize import setup

load_dotenv('./.env')
load_dotenv('../.env')

message_route = Blueprint("message_route", __name__)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "attachments"))


def _handle_error(e, action):
    if isinstance(e, PermissionError):
        return jsonify({"error": str(e)}), 403
    if isinstance(e, LookupError):
        return jsonify({"error": str(e)}), 404
    if isinstance(e, ValueError):
        return jsonify({"error": str(e)}), 400
    print(f"[Message] {action}: {e}")
    return jsonify({"error": f"{action}: {str(e)}"}), 500


def _save_attachments(files):
    saved_meta = []
    saved_paths = []
    for f in files:
        if not f or not f.filename:
            continue
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(f.filename)[1]
        stored_name = f"{uuid.uuid4().hex}{ext}"
        full_path = os.path.join(UPLOAD_DIR, stored_name)
        f.save(full_path)
        saved_paths.append(full_path)
        saved_meta.append({
            "fileName": f.filename,
            "fileUrl": f"/api/uploads/attachments/{stored_name}",
            "fileSize": os.path.getsize(full_path),
        })
    return saved_meta, saved_paths


def _cleanup_paths(paths):
    for p in paths:
        if os.path.exists(p):
            try:
                os.remove(p)
            except OSError as e:
                print(f"[Message] Blad usuwania pliku {p}: {e}")



@message_route.route("/workspaces/<workspaceId>/channels/<channelId>/messages", methods=["POST"])
@jwt_required()
def create_channel_message(workspaceId, channelId):
    email = get_jwt_identity()
    content = request.form.get("content", "")
    files = request.files.getlist("attachments")

    saved_meta, saved_paths = _save_attachments(files)
    try:
        message = setup.createMessageChannel(
            workspaceId=workspaceId,
            channelId=channelId,
            authorEmail=email,
            content=content,
            attachments=saved_meta,
        )
        return jsonify({"message": message}), 201
    except Exception as e:
        _cleanup_paths(saved_paths)
        return _handle_error(e, "Nie udalo sie utworzyc wiadomosci")


@message_route.route("/workspaces/<workspaceId>/channels/<channelId>/messages/<pageSize>/<page>", methods=["GET"])
@jwt_required()
def list_channel_messages(workspaceId, channelId, pageSize, page):
    email = get_jwt_identity()
    try:
        messages = setup.listAllMessageChannels(
            workspaceId=workspaceId,
            channelId=channelId,
            userEmail=email,
            page=page,
            pageSize=pageSize,
        )
        return jsonify({"messages": messages}), 200
    except Exception as e:
        return _handle_error(e, "Nie udalo sie pobrac wiadomosci")


@message_route.route("/workspaces/<workspaceId>/channels/<channelId>/messages/<messageId>", methods=["PATCH"])
@jwt_required()
def update_channel_message(workspaceId, channelId, messageId):
    email = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data or "content" not in data:
        return jsonify({"error": "Pole content jest wymagane"}), 400
    try:
        message = setup.updateMessageChannel(
            workspaceId=workspaceId,
            channelId=channelId,
            messageId=messageId,
            content=data["content"],
            editorEmail=email,
        )
        return jsonify({"message": message}), 200
    except Exception as e:
        return _handle_error(e, "Nie udalo sie zaktualizowac wiadomosci")


@message_route.route("/workspaces/<workspaceId>/channels/<channelId>/messages/<messageId>", methods=["DELETE"])
@jwt_required()
def delete_channel_message(workspaceId, channelId, messageId):
    email = get_jwt_identity()
    try:
        setup.deleteMessageChannel(
            workspaceId=workspaceId,
            channelId=channelId,
            messageId=messageId,
            requesterEmail=email,
        )
        return jsonify({"message": "Wiadomosc usunieta"}), 200
    except Exception as e:
        return _handle_error(e, "Nie udalo sie usunac wiadomosci")



@message_route.route("/workspaces/<workspaceId>/direct-chats/<directChatId>/messages", methods=["POST"])
@jwt_required()
def create_direct_chat_message(workspaceId, directChatId):
    email = get_jwt_identity()
    content = request.form.get("content", "")
    files = request.files.getlist("attachments")

    saved_meta, saved_paths = _save_attachments(files)
    try:
        message = setup.createMessageChat(
            workspaceId=workspaceId,
            directChatId=directChatId,
            authorEmail=email,
            content=content,
            attachments=saved_meta,
        )
        return jsonify({"message": message}), 201
    except Exception as e:
        _cleanup_paths(saved_paths)
        return _handle_error(e, "Nie udalo sie utworzyc wiadomosci")


@message_route.route("/workspaces/<workspaceId>/direct-chats/<directChatId>/messages/<pageSize>/<page>", methods=["GET"])
@jwt_required()
def list_direct_chat_messages(workspaceId, directChatId, pageSize, page):
    email = get_jwt_identity()
    try:
        messages = setup.listAllMessageChats(
            workspaceId=workspaceId,
            directChatId=directChatId,
            userEmail=email,
            page=page,
            pageSize=pageSize,
        )
        return jsonify({"messages": messages}), 200
    except Exception as e:
        return _handle_error(e, "Nie udalo sie pobrac wiadomosci")


@message_route.route("/workspaces/<workspaceId>/direct-chats/<directChatId>/messages/<messageId>", methods=["PATCH"])
@jwt_required()
def update_direct_chat_message(workspaceId, directChatId, messageId):
    email = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data or "content" not in data:
        return jsonify({"error": "Pole content jest wymagane"}), 400
    try:
        message = setup.updateMessageChat(
            workspaceId=workspaceId,
            directChatId=directChatId,
            messageId=messageId,
            content=data["content"],
            editorEmail=email,
        )
        return jsonify({"message": message}), 200
    except Exception as e:
        return _handle_error(e, "Nie udalo sie zaktualizowac wiadomosci")


@message_route.route("/workspaces/<workspaceId>/direct-chats/<directChatId>/messages/<messageId>", methods=["DELETE"])
@jwt_required()
def delete_direct_chat_message(workspaceId, directChatId, messageId):
    email = get_jwt_identity()
    try:
        setup.deleteMessageChat(
            workspaceId=workspaceId,
            directChatId=directChatId,
            messageId=messageId,
            requesterEmail=email,
        )
        return jsonify({"message": "Wiadomosc usunieta"}), 200
    except Exception as e:
        return _handle_error(e, "Nie udalo sie usunac wiadomosci")



@message_route.route("/uploads/attachments/<filename>", methods=["GET"])
def serve_attachment(filename):
    return send_from_directory(UPLOAD_DIR, filename)