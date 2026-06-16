# Szponcik - Slack like communication platform 
[Backend]

## Realtime (WebSockets)

Live updates run over Socket.IO (Flask-SocketIO), in the `realtime/` package:

- `realtime/__init__.py` — the shared `socketio` instance. `async_mode="threading"`
  (uses `simple-websocket`, no eventlet/gevent). **No message queue by default**:
  the backend runs as a single socket-serving process, so REST handlers and
  clients share memory and emits are delivered in-process. Kafka is *not* used as
  the socket backplane (it's a streaming log, not a fan-out bus).
- `realtime/handlers.py` — connect/disconnect (authenticated from the JWT
  **cookie**), room membership, `typing` relay and `presence`.
- `realtime/events.py` — helpers the REST routes call after a successful write.

**Rooms.** On connect a socket joins `user:<id>` and `workspace:<id>` for every
workspace it belongs to (authorized once, from the DB). Channel events fan out to
the workspace room; direct-chat events to each participant's user room.

**Events (server → client):** `message:new` · `message:updated` ·
`message:deleted` · `reaction:added` · `reaction:removed` · `typing` ·
`presence` · `presence:state` · `workspace:changed` · `workspaces:changed` ·
`workspace:deleted` · `directchats:changed`.
**Client → server:** `typing`, `presence:sync`.

**Running.** Dev: `python main.py` calls `socketio.run`. Prod (compose): a single
`gunicorn -k gthread -w 1 --threads 200` worker (all REST + sockets in one
process — no backplane needed).

**Scaling out.** To run multiple worker processes, add a Redis backplane and bump
the worker count: set `SOCKETIO_MESSAGE_QUEUE=redis://redis:6379/0` (a new `redis`
service) and `-w N`. Note: the `workspace_consumer` → owner "new workspace" push
only reaches clients when such a backplane is configured (cross-process); without
it the owner sees the new workspace on next refresh.