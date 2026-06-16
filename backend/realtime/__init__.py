"""
Realtime (WebSocket) layer for the backend.

Exposes a single :class:`flask_socketio.SocketIO` instance shared by the whole
process. By default there is **no message queue**: the backend runs as one
socket-serving process, so REST handlers and WebSocket clients share memory and
an ``emit`` reaches every client directly. This keeps the common case simple and
fast. To scale out to multiple worker processes, set ``SOCKETIO_MESSAGE_QUEUE``
to a Redis URL (the standard, low-latency Socket.IO backplane).

Kafka is intentionally *not* used as the socket backplane — it's a streaming log,
not a fan-out bus, and routing every chat message through it adds latency and a
failure point. Kafka stays for what it's good at (async workspace creation).

``async_mode="threading"`` uses ``simple-websocket`` (pure Python). We avoid
eventlet/gevent on purpose: no monkey-patching means psycopg2 and kafka-python
keep working unchanged, which matters on this Python build.
"""

import os

from flask_socketio import SocketIO

# Browser origins allowed to open the Socket.IO handshake. The httpOnly JWT
# cookie rides along (credentialed request), so "*" is not permitted — list the
# dev (Vite) and prod (nginx) origins explicitly. Mirrors the CORS policy in
# ``main.py`` (any localhost port).
_ORIGINS = [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:8080", "http://127.0.0.1:8080",
    "http://localhost:4173", "http://127.0.0.1:4173",
    "http://localhost:3000", "http://127.0.0.1:3000",
]

# Optional cross-process backplane. Unset (default) → in-process delivery, which
# is correct for a single socket-serving process. Set to a Redis URL to scale to
# multiple workers, e.g. SOCKETIO_MESSAGE_QUEUE=redis://redis:6379/0.
_mq_env = os.environ.get("SOCKETIO_MESSAGE_QUEUE")
if not _mq_env or _mq_env.strip().lower() in ("none", "off", "false"):
    _message_queue = None
else:
    _message_queue = _mq_env

socketio = SocketIO(
    cors_allowed_origins=_ORIGINS,
    async_mode="threading",
    message_queue=_message_queue,
    logger=False,
    engineio_logger=False,
)


def init_realtime(app):
    """
    Bind the shared :data:`socketio` to ``app`` and register the event handlers.

    Call once from ``main.py`` after the Flask app (and ``JWTManager``) are
    configured. Importing :mod:`realtime.handlers` here — not at module top — is
    what actually registers the ``@socketio.on(...)`` callbacks, and keeps the
    instance importable as a write-only emitter in processes that never serve.
    """
    # Flask-SocketIO needs a secret key for its session cookie; reuse the JWT one.
    app.config.setdefault("SECRET_KEY", app.config.get("JWT_SECRET_KEY") or "dev-secret")
    socketio.init_app(app)
    from . import handlers  # noqa: F401  (registers connect/disconnect/typing/presence)
    return socketio
