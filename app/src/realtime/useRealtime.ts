import {useCallback, useEffect, useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import type {Conversation} from "../data/messaging.ts";
import useUserStore from "../store/useUserStore.ts";
import useRealtimeStore, {type TypingUser} from "../store/useRealtimeStore.ts";
import {getSocket} from "./socket.ts";

/** A conversation's own id (channel id or direct-chat id). */
function conversationId(conversation: Conversation): string {
  return conversation.kind === "channel" ? conversation.channelId : conversation.directChatId;
}

/**
 * Realtime bindings for an open conversation: the list of *other* users
 * currently typing in it, and a `sendTyping` callback to broadcast the caller's
 * own typing state to the conversation's audience.
 */
export function useConversationRealtime(conversation: Conversation): {
  typingUsers: TypingUser[];
  sendTyping: (isTyping: boolean) => void;
} {
  const id = conversationId(conversation);
  const myId = useUserStore((state) => state.user?.id);
  const typingForConversation = useRealtimeStore(useShallow((state) => state.typing[id]));

  const typingUsers = useMemo(
    () => Object.values(typingForConversation ?? {}).filter((user) => user.id !== myId),
    [typingForConversation, myId],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      const socket = getSocket();
      if (!socket.connected) return;
      socket.emit(
        "typing",
        conversation.kind === "channel"
          ? {workspaceId: conversation.workspaceId, channelId: conversation.channelId, isTyping}
          : {workspaceId: conversation.workspaceId, directChatId: conversation.directChatId, isTyping},
      );
    },
    [conversation],
  );

  return {typingUsers, sendTyping};
}

/**
 * Ask the server for who is currently online in a workspace (once connected),
 * and return the live set of online user ids. Call from a workspace-scoped
 * component (e.g. the sidebar).
 */
export function useWorkspacePresence(workspaceId: string): Set<string> {
  const connected = useRealtimeStore((state) => state.connected);
  const online = useRealtimeStore((state) => state.online);

  useEffect(() => {
    if (!connected || !workspaceId) return;
    getSocket().emit("presence:sync", {workspaceId});
  }, [connected, workspaceId]);

  return online;
}

/** Whether a specific user is currently online (re-renders only on change). */
export function useIsOnline(userId: string | undefined): boolean {
  return useRealtimeStore((state) => (userId ? state.online.has(userId) : false));
}
