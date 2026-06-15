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

// A conversation is either a channel or a direct chat. Every messaging hook
// branches on this so screens can stay agnostic about which one they render.
export type Conversation =
  | {kind: "channel"; workspaceId: string; channelId: string}
  | {kind: "dm"; workspaceId: string; directChatId: string};

function conversationKey(conversation: Conversation) {
  return conversation.kind === "channel"
    ? qk.channelMessages(conversation.workspaceId, conversation.channelId)
    : qk.directChatMessages(conversation.workspaceId, conversation.directChatId);
}

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
