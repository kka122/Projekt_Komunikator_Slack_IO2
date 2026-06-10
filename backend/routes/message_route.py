from dotenv import load_dotenv
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from db.DataBaseSetupInitialize import setup

load_dotenv('./.env')
load_dotenv('../.env')

message_route = Blueprint("message_route", __name__)


@message_route.route("/workspaces/<workspaceId>/channels/<channelId>/messages", methods=["POST"])
@jwt_required()
def create_new_message(workspaceId, channelId):
    pass


@message_route.route("/workspaces/<workspaceId>/channels/<channelId>/messages/<pageSize>/<page>", methods=["GET"])
@jwt_required()
def create_new_message(workspaceId, channelId, pageSize, page):
    pass


@message_route.route("/workspaces/<workspaceId>/channels/<channelId>/messages/<messageId>", methods=["PATCH", "DELETE"])
@jwt_required()
def create_new_message(workspaceId, channelId, messageId):
    if request.method == "PATCH":
        update_message_channel(workspaceId, channelId, messageId)
    elif request.method == "DELETE":
        delete_message_channel(workspaceId, channelId, messageId)


@message_route.route("/workspaces/<workspaceId>/direct-chats/<directChatId>/messages", methods=["POST"])
@jwt_required()
def create_new_message(workspaceId, directChatId):
    pass


@message_route.route("/workspaces/<workspaceId>/direct-chats/<directChatId>/messages/<pageSize>/<page>", methods=["GET"])
@jwt_required()
def create_new_message(workspaceId, directChatId, pageSize, page):
    pass


@message_route.route("/workspaces/<workspaceId>/direct-chats/<directChatId>/messages/<messageId>", methods=["PATCH", "DELETE"])
@jwt_required()
def create_new_message(workspaceId, directChatId, messageId):
    if request.method == "PATCH":
        update_message_chat(workspaceId, directChatId, messageId)
    elif request.method == "DELETE":
        delete_message_chat(workspaceId, directChatId, messageId)


def update_message_channel(workspaceId, channelId, messageId):
    pass


def delete_message_channel(workspaceId, channelId, messageId):
    pass


def update_message_chat(workspaceId, directChatId, messageId):
    pass


def delete_message_chat(workspaceId, channelId, messageId):
    pass
