from dotenv import load_dotenv
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from db.DataBaseSetupInitialize import setup

load_dotenv('./.env')
load_dotenv('../.env')

webhook_route = Blueprint("webhook_route", __name__)


def _handle(fn):
    try:
        return fn()
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except (ValueError, LookupError) as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystapil blad: {str(e)}"}), 500


# ----- Incoming webhooks (external services post messages into a channel) -----

@webhook_route.route("/workspaces/<workspaceId>/channels/<channelId>/incoming-webhooks", methods=["POST"])
@jwt_required()
def create_incoming_webhook(workspaceId, channelId):
    email = get_jwt_identity()
    data = request.get_json(force=True, silent=True) or {}
    return _handle(lambda: (jsonify(setup.createIncomingWebhook(workspaceId, channelId, email, data.get("name"))), 201))


@webhook_route.route("/workspaces/<workspaceId>/incoming-webhooks", methods=["GET"])
@jwt_required()
def list_incoming_webhooks(workspaceId):
    email = get_jwt_identity()
    return _handle(lambda: (jsonify({"webhooks": setup.listIncomingWebhooks(workspaceId, email)}), 200))


@webhook_route.route("/workspaces/<workspaceId>/incoming-webhooks/<webhookId>", methods=["DELETE"])
@jwt_required()
def delete_incoming_webhook(workspaceId, webhookId):
    email = get_jwt_identity()
    return _handle(lambda: (setup.deleteIncomingWebhook(workspaceId, webhookId, email), jsonify({"message": "Usunieto"}), 200)[1:])


# ----- Outgoing webhooks (notify external URLs on workspace events; native/slack/discord) -----

@webhook_route.route("/workspaces/<workspaceId>/outgoing-webhooks", methods=["POST"])
@jwt_required()
def create_outgoing_webhook(workspaceId):
    email = get_jwt_identity()
    data = request.get_json(force=True, silent=True) or {}
    return _handle(lambda: (
        jsonify(setup.createOutgoingWebhook(
            workspaceId, email, data.get("name"), data.get("url"),
            data.get("format", "native"), data.get("events", []),
        )),
        201,
    ))


@webhook_route.route("/workspaces/<workspaceId>/outgoing-webhooks", methods=["GET"])
@jwt_required()
def list_outgoing_webhooks(workspaceId):
    email = get_jwt_identity()
    return _handle(lambda: (jsonify({"webhooks": setup.listOutgoingWebhooks(workspaceId, email)}), 200))


@webhook_route.route("/workspaces/<workspaceId>/outgoing-webhooks/<webhookId>", methods=["DELETE"])
@jwt_required()
def delete_outgoing_webhook(workspaceId, webhookId):
    email = get_jwt_identity()
    return _handle(lambda: (setup.deleteOutgoingWebhook(workspaceId, webhookId, email), jsonify({"message": "Usunieto"}), 200)[1:])


# ----- Public receiver (no auth — token in URL is the secret) -----

@webhook_route.route("/hooks/in/<token>", methods=["POST"])
def receive_incoming_webhook(token):
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text") or data.get("content") or ""
    return _handle(lambda: (jsonify(setup.postViaIncomingWebhook(token, text)), 200))
