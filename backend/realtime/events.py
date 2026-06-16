"""
Server-side event fan-out helpers.

REST handlers call these *after* a successful database write to push the change
to connected clients. Routing follows the room model set up in
:mod:`realtime.handlers`:

* **Channel** events go to the workspace room ``workspace:<id>`` — every member
  is in it, so the same emit drives both live updates (for whoever has the
  channel open) and unread badges (for everyone else).
* **Direct-chat** events go to each participant's personal room ``user:<id>``.
* **Structural** events (channel/member/workspace CRUD) ask clients to refetch
  the affected react-query cache rather than shipping a full payload.

Every helper is **best-effort**: the originating request already succeeded, so a
transient broker hiccup must never surface as an error. Failures are swallowed
and logged.
"""

from db.DataBaseSetupInitialize import setup
from . import socketio


def user_room(user_id):
    """Personal room every one of a user's sockets joins on connect."""
    return f"user:{user_id}"


def workspace_room(workspace_id):
    """Room every member of a workspace joins on connect."""
    return f"workspace:{workspace_id}"


def _emit(event, payload, room):
    try:
        socketio.emit(event, payload, room=room)
    except Exception as exc:  # never break the request that triggered the emit
        print(f"[Realtime] emit {event!r} -> {room} failed: {exc}")


def _channel_scope(workspace_id, channel_id):
    return {"workspaceId": str(workspace_id), "channelId": str(channel_id)}


def _dm_scope(workspace_id, direct_chat_id):
    return {"workspaceId": str(workspace_id), "directChatId": str(direct_chat_id)}


def _dm_emit(direct_chat_id, event, payload):
    for uid in setup.getDirectChatUserIds(direct_chat_id):
        _emit(event, payload, user_room(uid))


# --------------------------------------------------------------------------- #
#  Channel messages & reactions  (→ workspace room)                           #
# --------------------------------------------------------------------------- #

def channel_message_new(workspace_id, channel_id, message):
    _emit("message:new", {"scope": _channel_scope(workspace_id, channel_id), "message": message},
          workspace_room(workspace_id))


def channel_message_updated(workspace_id, channel_id, message):
    _emit("message:updated", {"scope": _channel_scope(workspace_id, channel_id), "message": message},
          workspace_room(workspace_id))


def channel_message_deleted(workspace_id, channel_id, message_id):
    _emit("message:deleted", {"scope": _channel_scope(workspace_id, channel_id), "messageId": str(message_id)},
          workspace_room(workspace_id))


def channel_reaction_added(workspace_id, channel_id, message_id, reaction):
    _emit("reaction:added",
          {"scope": _channel_scope(workspace_id, channel_id), "messageId": str(message_id), "reaction": reaction},
          workspace_room(workspace_id))


def channel_reaction_removed(workspace_id, channel_id, message_id, reaction_id):
    _emit("reaction:removed",
          {"scope": _channel_scope(workspace_id, channel_id), "messageId": str(message_id), "reactionId": str(reaction_id)},
          workspace_room(workspace_id))


# --------------------------------------------------------------------------- #
#  Direct-chat messages & reactions  (→ each participant's user room)         #
# --------------------------------------------------------------------------- #

def dm_message_new(workspace_id, direct_chat_id, message):
    _dm_emit(direct_chat_id, "message:new",
             {"scope": _dm_scope(workspace_id, direct_chat_id), "message": message})


def dm_message_updated(workspace_id, direct_chat_id, message):
    _dm_emit(direct_chat_id, "message:updated",
             {"scope": _dm_scope(workspace_id, direct_chat_id), "message": message})


def dm_message_deleted(workspace_id, direct_chat_id, message_id):
    _dm_emit(direct_chat_id, "message:deleted",
             {"scope": _dm_scope(workspace_id, direct_chat_id), "messageId": str(message_id)})


def dm_reaction_added(workspace_id, direct_chat_id, message_id, reaction):
    _dm_emit(direct_chat_id, "reaction:added",
             {"scope": _dm_scope(workspace_id, direct_chat_id), "messageId": str(message_id), "reaction": reaction})


def dm_reaction_removed(workspace_id, direct_chat_id, message_id, reaction_id):
    _dm_emit(direct_chat_id, "reaction:removed",
             {"scope": _dm_scope(workspace_id, direct_chat_id), "messageId": str(message_id), "reactionId": str(reaction_id)})


# --------------------------------------------------------------------------- #
#  Structural changes  (client refetches the affected query)                  #
# --------------------------------------------------------------------------- #

def workspace_changed(workspace_id):
    """Channels/members/logo changed — members refetch the workspaces query."""
    _emit("workspace:changed", {"workspaceId": str(workspace_id)}, workspace_room(workspace_id))


def workspace_deleted(workspace_id):
    """Workspace removed — members navigate away and refetch the list."""
    _emit("workspace:deleted", {"workspaceId": str(workspace_id)}, workspace_room(workspace_id))


def user_workspaces_changed(user_id):
    """A specific user's workspace membership changed — they refetch the list."""
    _emit("workspaces:changed", {}, user_room(user_id))


def direct_chats_changed(workspace_id, user_ids):
    """A new direct chat appeared — listed participants refetch their chats."""
    for uid in user_ids:
        _emit("directchats:changed", {"workspaceId": str(workspace_id)}, user_room(uid))


def user_profile_changed(user_id, workspace_ids):
    """A user's profile (status/name/avatar) changed — every workspace they
    belong to refetches the member/direct-chat lists that carry their identity."""
    for workspace_id in workspace_ids:
        _emit("user:changed", {"workspaceId": str(workspace_id), "userId": str(user_id)},
              workspace_room(workspace_id))
