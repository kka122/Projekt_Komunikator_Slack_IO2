/**
 * Central react-query key factory so reads and the mutations that invalidate
 * them always agree on the same key shape. Each entry is a stable array (or a
 * function returning one) used as a query key.
 */
export const qk = {
  /** Current user (`/users/me`). */
  me: ["users", "me"] as const,
  /** The signed-in user's workspaces. */
  workspaces: ["workspaces"] as const,
  /** Direct chats within a workspace. */
  directChats: (workspaceId: string) =>
    ["workspaces", workspaceId, "direct-chats"] as const,
  /** Messages in a channel. */
  channelMessages: (workspaceId: string, channelId: string) =>
    ["workspaces", workspaceId, "channels", channelId, "messages"] as const,
  /** Messages in a direct chat. */
  directChatMessages: (workspaceId: string, directChatId: string) =>
    ["workspaces", workspaceId, "direct-chats", directChatId, "messages"] as const,
  /** User lookup by email regex (member invites). */
  userSearch: (emailRegex: string) => ["users", "search", emailRegex] as const,
};
