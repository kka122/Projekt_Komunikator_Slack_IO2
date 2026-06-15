// Central react-query keys so reads and the mutations that invalidate them
// always agree on the same key shape.
export const qk = {
  me: ["users", "me"] as const,
  workspaces: ["workspaces"] as const,
  directChats: (workspaceId: string) =>
    ["workspaces", workspaceId, "direct-chats"] as const,
  channelMessages: (workspaceId: string, channelId: string) =>
    ["workspaces", workspaceId, "channels", channelId, "messages"] as const,
  directChatMessages: (workspaceId: string, directChatId: string) =>
    ["workspaces", workspaceId, "direct-chats", directChatId, "messages"] as const,
  userSearch: (emailRegex: string) => ["users", "search", emailRegex] as const,
};
