import type {Message, Reaction} from "../api/models";
import {qk} from "../data/keys.ts";

/**
 * Realtime event contract shared with the backend (`backend/realtime/`). Every
 * message/reaction event carries a {@link ConversationScope} so the client can
 * route it to the right react-query cache entry.
 */

/** A channel target — `channelId` distinguishes it from a DM scope. */
export interface ChannelScope {
  workspaceId: string;
  channelId: string;
}

/** A direct-chat target. */
export interface DmScope {
  workspaceId: string;
  directChatId: string;
}

/** Either conversation kind, as sent on the wire. */
export type ConversationScope = ChannelScope | DmScope;

/** The lightweight user identity attached to typing events. */
export interface RealtimeUser {
  id: string;
  name: string;
  surname: string;
}

/** `message:new` / `message:updated`. */
export interface MessagePayload {
  scope: ConversationScope;
  message: Message;
}

/** `message:deleted`. */
export interface MessageDeletedPayload {
  scope: ConversationScope;
  messageId: string;
}

/** `reaction:added`. */
export interface ReactionAddedPayload {
  scope: ConversationScope;
  messageId: string;
  reaction: Reaction;
}

/** `reaction:removed`. */
export interface ReactionRemovedPayload {
  scope: ConversationScope;
  messageId: string;
  reactionId: string;
}

/** `typing` — `isTyping` toggles the indicator for `user` in `scope`. */
export interface TypingPayload {
  scope: ConversationScope;
  user: RealtimeUser;
  isTyping: boolean;
}

/** `presence` — a single user's connect/disconnect transition. */
export interface PresencePayload {
  userId: string;
  online: boolean;
}

/** `presence:state` — the set of users currently online in a workspace. */
export interface PresenceStatePayload {
  workspaceId: string;
  online: string[];
}

/** `workspace:changed` / `workspace:deleted` / `directchats:changed`. */
export interface WorkspaceScopedPayload {
  workspaceId: string;
}

/** `user:changed` — a user's profile (status/name/avatar) changed in a workspace. */
export interface UserChangedPayload {
  workspaceId: string;
  userId: string;
}

/** Narrow a {@link ConversationScope} to a channel scope. */
export function isChannelScope(scope: ConversationScope): scope is ChannelScope {
  return (scope as ChannelScope).channelId !== undefined;
}

/** The conversation's own id (channel id or direct-chat id). */
export function scopeConversationId(scope: ConversationScope): string {
  return isChannelScope(scope) ? scope.channelId : scope.directChatId;
}

/** The react-query key for the conversation's message list (any page). */
export function scopeMessagesKey(scope: ConversationScope) {
  return isChannelScope(scope)
    ? qk.channelMessages(scope.workspaceId, scope.channelId)
    : qk.directChatMessages(scope.workspaceId, scope.directChatId);
}

// --------------------------------------------------------------------------- //
//  Pure cache updaters. Each takes the cached list and returns a new list,     //
//  staying idempotent (events may be re-delivered, and the sender also gets    //
//  its own echo) and preserving the API's newest-first ordering.              //
// --------------------------------------------------------------------------- //

/** Insert a new message at the front, unless it is already present. */
export function applyMessageNew(list: Message[] | undefined, message: Message): Message[] {
  const messages = list ?? [];
  if (messages.some((m) => m.id === message.id)) return messages;
  return [message, ...messages];
}

/** Replace a message in place (no-op if it isn't cached). */
export function applyMessageUpdated(list: Message[] | undefined, message: Message): Message[] {
  return (list ?? []).map((m) => (m.id === message.id ? message : m));
}

/** Drop a message by id. */
export function applyMessageDeleted(list: Message[] | undefined, messageId: string): Message[] {
  return (list ?? []).filter((m) => m.id !== messageId);
}

/** Add a reaction to a message, unless that reaction id is already present. */
export function applyReactionAdded(
  list: Message[] | undefined,
  messageId: string,
  reaction: Reaction,
): Message[] {
  return (list ?? []).map((m) => {
    if (m.id !== messageId) return m;
    const reactions = m.reactions ?? [];
    if (reactions.some((r) => r.id === reaction.id)) return m;
    return {...m, reactions: [...reactions, reaction]};
  });
}

/** Remove a reaction from a message by reaction id. */
export function applyReactionRemoved(
  list: Message[] | undefined,
  messageId: string,
  reactionId: string,
): Message[] {
  return (list ?? []).map((m) =>
    m.id === messageId
      ? {...m, reactions: (m.reactions ?? []).filter((r) => r.id !== reactionId)}
      : m,
  );
}
