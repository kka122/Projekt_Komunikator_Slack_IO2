import {create} from "zustand";
import type {RealtimeUser} from "../realtime/events.ts";

/** A user shown as currently typing in a conversation, with a freshness stamp. */
export interface TypingUser extends RealtimeUser {
  /** `Date.now()` of the last typing signal — used to expire stale indicators. */
  at: number;
}

/** State held by {@link useRealtimeStore}. */
interface RealtimeStoreData {
  /** Whether the socket is currently connected. */
  connected: boolean;
  /** Ids of users currently online (presence). */
  online: Set<string>;
  /** Typing users keyed by conversation id, then by user id. */
  typing: Record<string, Record<string, TypingUser>>;
}

/** Actions exposed by {@link useRealtimeStore}. */
interface RealtimeStoreActions {
  /** Set the socket connection flag. */
  setConnected: (connected: boolean) => void;
  /** Replace the online set (e.g. from a `presence:state` sync). */
  setOnline: (userIds: string[]) => void;
  /** Merge extra ids into the online set. */
  addOnline: (userIds: string[]) => void;
  /** Flip a single user online/offline (a `presence` transition). */
  setUserOnline: (userId: string, online: boolean) => void;
  /** Add or remove a typing user for a conversation. */
  setTyping: (conversationId: string, user: TypingUser, isTyping: boolean) => void;
  /** Clear all realtime state (on disconnect/logout). */
  reset: () => void;
}

/**
 * Cross-cutting realtime state (zustand). {@link RealtimeProvider} writes to it
 * from socket events; components read presence and typing from it without
 * touching the socket directly. Mirrors the project's other global stores
 * ({@link useUserStore}, {@link useModalStore}).
 */
const useRealtimeStore = create<RealtimeStoreData & RealtimeStoreActions>((set) => ({
  connected: false,
  online: new Set<string>(),
  typing: {},

  setConnected: (connected) => set({connected}),

  setOnline: (userIds) => set({online: new Set(userIds)}),

  addOnline: (userIds) =>
    set((state) => {
      const online = new Set(state.online);
      userIds.forEach((id) => online.add(id));
      return {online};
    }),

  setUserOnline: (userId, online) =>
    set((state) => {
      const next = new Set(state.online);
      if (online) next.add(userId);
      else next.delete(userId);
      return {online: next};
    }),

  setTyping: (conversationId, user, isTyping) =>
    set((state) => {
      const forConversation = {...(state.typing[conversationId] ?? {})};
      if (isTyping) forConversation[user.id] = user;
      else delete forConversation[user.id];
      return {typing: {...state.typing, [conversationId]: forConversation}};
    }),

  reset: () => set({connected: false, online: new Set<string>(), typing: {}}),
}));

export default useRealtimeStore;
