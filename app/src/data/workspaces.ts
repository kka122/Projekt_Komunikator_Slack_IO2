import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
  acceptWorkspacePayment,
  createWorkspace,
  listWorkspaces,
  updateWorkspaceLogo,
} from "../api/endpoints/workspace/workspace.ts";
import {
  createChannel,
  deleteChannel,
  updateChannelName,
} from "../api/endpoints/channel/channel.ts";
import {
  addUserToWorkspace,
  removeUserFromWorkspace,
  updateUserRoleInWorkspace,
} from "../api/endpoints/user/user.ts";
import {ListWorkspacesResponse} from "../api/endpoints/workspace/workspace.zod.ts";
import type {
  AcceptPaymentBody,
  CreateWorkspaceBody,
  UpdateUserRoleBody,
  Workspace,
} from "../api/models";
import {qk} from "./keys.ts";

/**
 * Query for the signed-in user's workspaces. The workspace payload embeds its
 * channels and members, so most workspace-scoped screens read from this one
 * query and the mutations below invalidate it.
 */
export function useWorkspaces() {
  return useQuery({
    queryKey: qk.workspaces,
    queryFn: async (): Promise<Workspace[]> => {
      const response = await listWorkspaces();
      return ListWorkspacesResponse.parse(response.data).workspaces;
    },
  });
}

/**
 * Mutation that starts workspace creation. The workspace is provisional until
 * paid for; this returns the Stripe client secret used to confirm payment.
 *
 * @returns The Stripe payment-intent client secret.
 */
export function useCreateWorkspace() {
  return useMutation({
    mutationFn: async (data: CreateWorkspaceBody): Promise<string> => {
      const response = await createWorkspace(data);
      return response.data.clientSecret;
    },
  });
}

/**
 * Mutation that confirms a workspace payment server-side (after Stripe
 * succeeds), then refreshes the workspace list so the new one appears.
 */
export function useAcceptWorkspacePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AcceptPaymentBody) => acceptWorkspacePayment(data),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

/** Mutation that uploads a new workspace logo, then refreshes the list. */
export function useUpdateWorkspaceLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({workspaceId, logo}: {workspaceId: string; logo: File}) =>
      updateWorkspaceLogo(workspaceId, {workspaceLogo: logo}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

// ----- Channels (a channel lives inside the workspace payload) -----

/** Mutation that creates a channel in a workspace, then refreshes the list. */
export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({workspaceId, name}: {workspaceId: string; name: string}) =>
      createChannel(workspaceId, {name}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

/** Mutation that renames a channel, then refreshes the workspace list. */
export function useRenameChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      channelId,
      name,
    }: {
      workspaceId: string;
      channelId: string;
      name: string;
    }) => updateChannelName(workspaceId, channelId, {name}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

/** Mutation that deletes a channel (and its messages), then refreshes. */
export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({workspaceId, channelId}: {workspaceId: string; channelId: string}) =>
      deleteChannel(workspaceId, channelId),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

// ----- Members -----

/** Mutation that adds a user to a workspace, then refreshes the list. */
export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({userId, workspaceId}: {userId: string; workspaceId: string}) =>
      addUserToWorkspace(userId, workspaceId),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

/** Mutation that removes a user from a workspace, then refreshes the list. */
export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({userId, workspaceId}: {userId: string; workspaceId: string}) =>
      removeUserFromWorkspace(userId, workspaceId),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

/** Mutation that changes a member's role (admin/member), then refreshes. */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      workspaceId,
      role,
    }: {
      userId: string;
      workspaceId: string;
      role: UpdateUserRoleBody["role"];
    }) => updateUserRoleInWorkspace(userId, workspaceId, {role}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}
