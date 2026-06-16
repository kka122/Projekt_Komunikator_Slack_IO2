import {type JSX, type ReactNode, useEffect, useRef} from "react";
import {useNavigate} from "react-router";
import {useQueryClient} from "@tanstack/react-query";
import axios from "axios";
import type {Message} from "../api/models";
import {qk} from "../data/keys.ts";
import useUserStore from "../store/useUserStore.ts";
import useRealtimeStore from "../store/useRealtimeStore.ts";
import {getSocket} from "./socket.ts";
import {ensureNotificationPermission, notifyMessage} from "./notifications.ts";
import {
  applyMessageDeleted,
  applyMessageNew,
  applyMessageUpdated,
  applyReactionAdded,
  applyReactionRemoved,
  isChannelScope,
  scopeConversationId,
  scopeConversationPath,
  scopeMessagesKey,
  type MessageDeletedPayload,
  type MessagePayload,
  type PresencePayload,
  type PresenceStatePayload,
  type ReactionAddedPayload,
  type ReactionRemovedPayload,
  type TypingPayload,
  type UserChangedPayload,
  type WorkspaceScopedPayload,
} from "./events.ts";

/** Typing indicators self-expire after this long without a fresh signal. */
const TYPING_TTL_MS = 5000;

/**
 * Owns the realtime connection for the authenticated part of the app. Mounted
 * by {@link RequireAuth}, so the socket connects once a user is present and
 * disconnects on logout. It translates inbound socket events into react-query
 * cache updates (live messages/reactions), structural invalidations
 * (channels/members/workspaces/chats) and {@link useRealtimeStore} updates
 * (presence + typing). It never renders UI of its own.
 */
function RealtimeProvider({children}: {children: ReactNode}): JSX.Element {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const refreshTried = useRef(false);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const socket = getSocket();
    const store = useRealtimeStore.getState;
    const timers = typingTimers.current;

    // Ask for desktop-notification permission once the user is in the app.
    ensureNotificationPermission();

    const patchMessages = (
      payload: {scope: MessagePayload["scope"]},
      updater: (list: Message[] | undefined) => Message[],
    ) => {
      queryClient.setQueriesData<Message[]>({queryKey: scopeMessagesKey(payload.scope)}, (old) =>
        updater(old),
      );
    };

    const onConnect = () => {
      refreshTried.current = false;
      store().setConnected(true);
    };

    const onDisconnect = () => store().setConnected(false);

    // A handshake rejected for a stale 15-minute access token: refresh once
    // (shares the same cookie flow as the axios interceptor) and reconnect.
    const onConnectError = async () => {
      store().setConnected(false);
      if (refreshTried.current) return;
      refreshTried.current = true;
      try {
        await axios.post("/auth/refresh");
        socket.connect();
      } catch {
        // Refresh failed — stay disconnected; the REST guards handle redirect.
      }
    };

    const onMessageNew = (payload: MessagePayload) => {
      patchMessages(payload, (list) => applyMessageNew(list, payload.message));
      // Only react to messages that aren't ours.
      if (payload.message.sender.id !== useUserStore.getState().user?.id) {
        // Bump unread badges (the conversation may not be in view).
        if (isChannelScope(payload.scope)) {
          queryClient.invalidateQueries({queryKey: qk.workspaces});
        } else {
          queryClient.invalidateQueries({queryKey: qk.directChats(payload.scope.workspaceId)});
        }
        // Desktop notification, unless the user is already looking at this
        // conversation (tab visible and its route open).
        const path = scopeConversationPath(payload.scope);
        const viewing = !document.hidden && window.location.pathname.startsWith(path);
        if (!viewing) {
          notifyMessage(payload.message, scopeConversationId(payload.scope), () => navigate(path));
        }
      }
    };

    const onMessageUpdated = (payload: MessagePayload) =>
      patchMessages(payload, (list) => applyMessageUpdated(list, payload.message));

    const onMessageDeleted = (payload: MessageDeletedPayload) =>
      patchMessages(payload, (list) => applyMessageDeleted(list, payload.messageId));

    const onReactionAdded = (payload: ReactionAddedPayload) =>
      patchMessages(payload, (list) => applyReactionAdded(list, payload.messageId, payload.reaction));

    const onReactionRemoved = (payload: ReactionRemovedPayload) =>
      patchMessages(payload, (list) =>
        applyReactionRemoved(list, payload.messageId, payload.reactionId),
      );

    const onTyping = (payload: TypingPayload) => {
      const conversationId = scopeConversationId(payload.scope);
      const timerKey = `${conversationId}:${payload.user.id}`;
      const existing = timers.get(timerKey);
      if (existing) clearTimeout(existing);

      if (payload.isTyping) {
        store().setTyping(conversationId, {...payload.user, at: Date.now()}, true);
        timers.set(
          timerKey,
          setTimeout(() => {
            useRealtimeStore.getState().setTyping(conversationId, {...payload.user, at: 0}, false);
            timers.delete(timerKey);
          }, TYPING_TTL_MS),
        );
      } else {
        store().setTyping(conversationId, {...payload.user, at: 0}, false);
        timers.delete(timerKey);
      }
    };

    const onPresence = (payload: PresencePayload) =>
      store().setUserOnline(payload.userId, payload.online);

    const onPresenceState = (payload: PresenceStatePayload) => store().addOnline(payload.online);

    const onWorkspaceChanged = () => queryClient.invalidateQueries({queryKey: qk.workspaces});

    const onWorkspaceDeleted = (payload: WorkspaceScopedPayload) => {
      queryClient.invalidateQueries({queryKey: qk.workspaces});
      if (window.location.pathname.includes(`/workspaces/${payload.workspaceId}`)) {
        navigate("/workspaces");
      }
    };

    const onDirectChatsChanged = (payload: WorkspaceScopedPayload) =>
      queryClient.invalidateQueries({queryKey: qk.directChats(payload.workspaceId)});

    // A member changed their status/name/avatar: refetch the member and
    // direct-chat lists that embed it, plus our own profile if it was us.
    const onUserChanged = (payload: UserChangedPayload) => {
      queryClient.invalidateQueries({queryKey: qk.workspaces});
      queryClient.invalidateQueries({queryKey: qk.directChats(payload.workspaceId)});
      if (payload.userId === useUserStore.getState().user?.id) {
        queryClient.invalidateQueries({queryKey: qk.me});
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("message:new", onMessageNew);
    socket.on("message:updated", onMessageUpdated);
    socket.on("message:deleted", onMessageDeleted);
    socket.on("reaction:added", onReactionAdded);
    socket.on("reaction:removed", onReactionRemoved);
    socket.on("typing", onTyping);
    socket.on("presence", onPresence);
    socket.on("presence:state", onPresenceState);
    socket.on("workspace:changed", onWorkspaceChanged);
    socket.on("workspaces:changed", onWorkspaceChanged);
    socket.on("workspace:deleted", onWorkspaceDeleted);
    socket.on("directchats:changed", onDirectChatsChanged);
    socket.on("user:changed", onUserChanged);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("message:new", onMessageNew);
      socket.off("message:updated", onMessageUpdated);
      socket.off("message:deleted", onMessageDeleted);
      socket.off("reaction:added", onReactionAdded);
      socket.off("reaction:removed", onReactionRemoved);
      socket.off("typing", onTyping);
      socket.off("presence", onPresence);
      socket.off("presence:state", onPresenceState);
      socket.off("workspace:changed", onWorkspaceChanged);
      socket.off("workspaces:changed", onWorkspaceChanged);
      socket.off("workspace:deleted", onWorkspaceDeleted);
      socket.off("directchats:changed", onDirectChatsChanged);
      socket.off("user:changed", onUserChanged);
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      socket.disconnect();
      useRealtimeStore.getState().reset();
    };
  }, [queryClient, navigate]);

  return <>{children}</>;
}

export default RealtimeProvider;
