import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {listDirectChats} from "../api/endpoints/direct-chat/direct-chat.ts";
import {ListDirectChatsResponse} from "../api/endpoints/direct-chat/direct-chat.zod.ts";
import {
  createChannelMessage,
  createDirectChatMessage,
  deleteChannelMessage,
  deleteDirectChatMessage,
  listChannelMessages,
  listDirectChatMessages,
  updateChannelMessage,
  updateDirectChatMessage,
} from "../api/endpoints/message/message.ts";
import {
  ListChannelMessagesResponse,
  ListDirectChatMessagesResponse,
} from "../api/endpoints/message/message.zod.ts";
import {
  addReactionToChannelMessage,
  addReactionToDirectChatMessage,
  removeReactionFromChannelMessage,
  removeReactionFromDirectChatMessage,
} from "../api/endpoints/reaction/reaction.ts";
import type {DirectChat, Message} from "../api/models";
import {qk} from "./keys.ts";

/**
 * A messaging target: either a channel or a direct chat. Discriminated by
 * `kind`. Every messaging hook branches on this so screens can stay agnostic
 * about which one they render.
 */
export type Conversation =
  | {kind: "channel"; workspaceId: string; channelId: string}
  | {kind: "dm"; workspaceId: string; directChatId: string};

/** Resolve the react-query key for a conversation's message list. */
function conversationKey(conversation: Conversation) {
  return conversation.kind === "channel"
    ? qk.channelMessages(conversation.workspaceId, conversation.channelId)
    : qk.directChatMessages(conversation.workspaceId, conversation.directChatId);
}

/**
 * Query for the workspace's direct chats. Disabled until a workspace id is
 * available.
 */
export function useDirectChats(workspaceId: string) {
  return useQuery({
    queryKey: qk.directChats(workspaceId),
    enabled: workspaceId.length > 0,
    queryFn: async (): Promise<DirectChat[]> => {
      const response = await listDirectChats(workspaceId);
      return ListDirectChatsResponse.parse(response.data).directChats;
    },
  });
}

/**
 * Query for a conversation's messages (channel or DM), paginated.
 *
 * @param conversation - The channel or direct chat to read.
 * @param pageSize - Messages per page. Defaults to 20.
 * @param page - 1-based page number. Defaults to 1.
 */
export function useMessages(conversation: Conversation, pageSize = 20, page = 1) {
  return useQuery({
    queryKey: [...conversationKey(conversation), pageSize, page],
    queryFn: async (): Promise<Message[]> => {
      if (conversation.kind === "channel") {
        const response = await listChannelMessages(
          conversation.workspaceId,
          conversation.channelId,
          pageSize,
          page,
        );
        return ListChannelMessagesResponse.parse(response.data).messages;
      }
      const response = await listDirectChatMessages(
        conversation.workspaceId,
        conversation.directChatId,
        pageSize,
        page,
      );
      return ListDirectChatMessagesResponse.parse(response.data).messages;
    },
  });
}

/**
 * Mutation that posts a new message (with optional file attachments) to the
 * conversation, then invalidates its message list.
 */
export function useSendMessage(conversation: Conversation) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({content, attachments}: {content: string; attachments: File[]}) => {
      const body = {content, attachments};
      return conversation.kind === "channel"
        ? createChannelMessage(conversation.workspaceId, conversation.channelId, body)
        : createDirectChatMessage(conversation.workspaceId, conversation.directChatId, body);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: conversationKey(conversation)}),
  });
}

/** Mutation that edits a message's text, then refreshes the conversation. */
export function useEditMessage(conversation: Conversation) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({messageId, content}: {messageId: string; content: string}) =>
      conversation.kind === "channel"
        ? updateChannelMessage(conversation.workspaceId, conversation.channelId, messageId, {content})
        : updateDirectChatMessage(conversation.workspaceId, conversation.directChatId, messageId, {content}),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: conversationKey(conversation)}),
  });
}

/** Mutation that deletes a message by id, then refreshes the conversation. */
export function useDeleteMessage(conversation: Conversation) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      conversation.kind === "channel"
        ? deleteChannelMessage(conversation.workspaceId, conversation.channelId, messageId)
        : deleteDirectChatMessage(conversation.workspaceId, conversation.directChatId, messageId),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: conversationKey(conversation)}),
  });
}

/** Mutation that adds an emoji reaction to a message in the conversation. */
export function useAddReaction(conversation: Conversation) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({messageId, emoji}: {messageId: string; emoji: string}) =>
      conversation.kind === "channel"
        ? addReactionToChannelMessage(conversation.workspaceId, conversation.channelId, messageId, {emoji})
        : addReactionToDirectChatMessage(conversation.workspaceId, conversation.directChatId, messageId, {emoji}),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: conversationKey(conversation)}),
  });
}

/** Mutation that removes one of the caller's reactions (by reaction id). */
export function useRemoveReaction(conversation: Conversation) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({messageId, reactionId}: {messageId: string; reactionId: string}) =>
      conversation.kind === "channel"
        ? removeReactionFromChannelMessage(conversation.workspaceId, conversation.channelId, messageId, reactionId)
        : removeReactionFromDirectChatMessage(conversation.workspaceId, conversation.directChatId, messageId, reactionId),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: conversationKey(conversation)}),
  });
}
