import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
  createIncomingWebhook,
  createOutgoingWebhook,
  deleteIncomingWebhook,
  deleteOutgoingWebhook,
  listIncomingWebhooks,
  listOutgoingWebhooks,
} from "../api/endpoints/webhook/webhook.ts";
import type {
  CreateOutgoingWebhookBody,
  IncomingWebhook,
  OutgoingWebhook,
} from "../api/models";
import {qk} from "./keys.ts";

/** Query for a workspace's incoming webhooks (admin only). */
export function useIncomingWebhooks(workspaceId: string) {
  return useQuery({
    queryKey: qk.incomingWebhooks(workspaceId),
    enabled: workspaceId.length > 0,
    queryFn: async (): Promise<IncomingWebhook[]> => {
      const response = await listIncomingWebhooks(workspaceId);
      return response.data.webhooks;
    },
  });
}

/** Mutation that creates an incoming webhook bound to a channel. */
export function useCreateIncomingWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({workspaceId, channelId, name}: {workspaceId: string; channelId: string; name: string}) =>
      createIncomingWebhook(workspaceId, channelId, {name}),
    onSuccess: (_data, {workspaceId}) =>
      queryClient.invalidateQueries({queryKey: qk.incomingWebhooks(workspaceId)}),
  });
}

/** Mutation that revokes an incoming webhook. */
export function useDeleteIncomingWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({workspaceId, webhookId}: {workspaceId: string; webhookId: string}) =>
      deleteIncomingWebhook(workspaceId, webhookId),
    onSuccess: (_data, {workspaceId}) =>
      queryClient.invalidateQueries({queryKey: qk.incomingWebhooks(workspaceId)}),
  });
}

/** Query for a workspace's outgoing webhooks (admin only). */
export function useOutgoingWebhooks(workspaceId: string) {
  return useQuery({
    queryKey: qk.outgoingWebhooks(workspaceId),
    enabled: workspaceId.length > 0,
    queryFn: async (): Promise<OutgoingWebhook[]> => {
      const response = await listOutgoingWebhooks(workspaceId);
      return response.data.webhooks;
    },
  });
}

/**
 * Mutation that registers an outgoing webhook. Resolves to the created webhook,
 * which includes the one-time `secret` for native (signed) deliveries.
 */
export function useCreateOutgoingWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({workspaceId, body}: {workspaceId: string; body: CreateOutgoingWebhookBody}): Promise<OutgoingWebhook> => {
      const response = await createOutgoingWebhook(workspaceId, body);
      return response.data;
    },
    onSuccess: (_data, {workspaceId}) =>
      queryClient.invalidateQueries({queryKey: qk.outgoingWebhooks(workspaceId)}),
  });
}

/** Mutation that deletes an outgoing webhook. */
export function useDeleteOutgoingWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({workspaceId, webhookId}: {workspaceId: string; webhookId: string}) =>
      deleteOutgoingWebhook(workspaceId, webhookId),
    onSuccess: (_data, {workspaceId}) =>
      queryClient.invalidateQueries({queryKey: qk.outgoingWebhooks(workspaceId)}),
  });
}
