"""
Socket.IO connection handlers: authentication, room membership, presence and
typing indicators.

**Authentication.** The handshake is an HTTP GET carrying the httpOnly JWT
cookie, so we authenticate with ``verify_jwt_in_request(locations=["cookies"])``.
flask-jwt-extended only enforces CSRF on state-changing methods, so the GET
handshake passes with just the cookie. A connection that fails auth is rejected
(``return False``).

**Rooms.** On connect a socket joins its personal ``user:<id>`` room and the
``workspace:<id>`` room of every workspace the user belongs to. Membership is
thus authorized once, at connect, from the database — a client can never receive
events for a workspace it is not in.

**Per-worker state.** A socket's own inbound events (typing, presence:sync)
always arrive on the worker that owns its connection, so the local
``_SID_INFO`` / ``_USER_SIDS`` maps are the correct scope. Presence flips are
ref-counted per user so multiple tabs don't spuriously toggle offline. Across
gunicorn workers presence is best-effort (no shared store); the dev server runs
a single process, where it is exact.
"""

from collections import defaultdict

from flask import request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask_socketio import join_room, emit

from db.DataBaseSetupInitialize import setup
from . import socketio
from .events import user_room, workspace_room

# sid -> {"id", "name", "surname", "email", "workspaceIds"}
_SID_INFO = {}
# user_id -> {sid, ...}  (tracks multi-tab connections on this worker)
_USER_SIDS = defaultdict(set)


def _identify():
    """Resolve the authenticated user from the handshake cookie, or ``None``."""
    verify_jwt_in_request(locations=["cookies"])
    email = get_jwt_identity()
    if not email:
        return None
    return setup.getUserByEmail(email)


@socketio.on("connect")
def on_connect():
    try:
        user = _identify()
    except Exception:
        return False  # reject: missing/invalid/expired token
    if user is None:
        return False

    workspace_ids = setup.getUserWorkspaceIds(user.email)
    _SID_INFO[request.sid] = {
        "id": user.id,
        "name": user.name,
        "surname": user.surname,
        "email": user.email,
        "workspaceIds": workspace_ids,
    }
    first_connection = len(_USER_SIDS[user.id]) == 0
    _USER_SIDS[user.id].add(request.sid)

    join_room(user_room(user.id))
    for workspace_id in workspace_ids:
        join_room(workspace_room(workspace_id))

    # Announce arrival once (first tab), to every workspace the user is in.
    if first_connection:
        for workspace_id in workspace_ids:
            emit("presence", {"userId": str(user.id), "online": True},
                 room=workspace_room(workspace_id), include_self=False)
    return True


@socketio.on("disconnect")
def on_disconnect():
    info = _SID_INFO.pop(request.sid, None)
    if not info:
        return
    sids = _USER_SIDS.get(info["id"])
    if sids is not None:
        sids.discard(request.sid)
    # Flip offline only when the user's last tab on this worker closes.
    if not sids:
        _USER_SIDS.pop(info["id"], None)
        for workspace_id in info["workspaceIds"]:
            emit("presence", {"userId": str(info["id"]), "online": False},
                 room=workspace_room(workspace_id))


@socketio.on("presence:sync")
def on_presence_sync(data):
    """Reply to a just-connected client with the users currently online here."""
    info = _SID_INFO.get(request.sid)
    if not info:
        return
    try:
        workspace_id = int((data or {}).get("workspaceId"))
    except (TypeError, ValueError):
        return
    if workspace_id not in info["workspaceIds"]:
        return
    online = sorted({
        str(entry["id"])
        for entry in _SID_INFO.values()
        if workspace_id in entry["workspaceIds"]
    })
    emit("presence:state", {"workspaceId": str(workspace_id), "online": online})


@socketio.on("typing")
def on_typing(data):
    """Relay an ephemeral typing indicator to the conversation's audience."""
    info = _SID_INFO.get(request.sid)
    if not info or not data:
        return

    is_typing = bool(data.get("isTyping"))
    actor = {"id": str(info["id"]), "name": info["name"], "surname": info["surname"]}
    channel_id = data.get("channelId")
    direct_chat_id = data.get("directChatId")

    if channel_id is not None:
        try:
            workspace_id = int(data.get("workspaceId"))
        except (TypeError, ValueError):
            return
        if workspace_id not in info["workspaceIds"]:
            return  # can't type into a workspace you don't belong to
        emit("typing",
             {"scope": {"workspaceId": str(workspace_id), "channelId": str(channel_id)},
              "user": actor, "isTyping": is_typing},
             room=workspace_room(workspace_id), include_self=False)
        return

    if direct_chat_id is not None:
        participant_ids = setup.getDirectChatUserIds(direct_chat_id)
        if info["id"] not in participant_ids:
            return  # can't type into a chat you're not part of
        payload = {
            "scope": {"workspaceId": str(data.get("workspaceId")), "directChatId": str(direct_chat_id)},
            "user": actor,
            "isTyping": is_typing,
        }
        for participant_id in participant_ids:
            if participant_id != info["id"]:
                emit("typing", payload, room=user_room(participant_id))
