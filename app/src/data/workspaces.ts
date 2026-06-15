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

export function useWorkspaces() {
  return useQuery({
    queryKey: qk.workspaces,
    queryFn: async (): Promise<Workspace[]> => {
      const response = await listWorkspaces();
      return ListWorkspacesResponse.parse(response.data).workspaces;
    },
  });
}

export function useCreateWorkspace() {
  return useMutation({
    mutationFn: async (data: CreateWorkspaceBody): Promise<string> => {
      const response = await createWorkspace(data);
      return response.data.clientSecret;
    },
  });
}

export function useAcceptWorkspacePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AcceptPaymentBody) => acceptWorkspacePayment(data),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

export function useUpdateWorkspaceLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({workspaceId, logo}: {workspaceId: string; logo: File}) =>
      updateWorkspaceLogo(workspaceId, {workspaceLogo: logo}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

// ----- Channels (a channel lives inside the workspace payload) -----

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({workspaceId, name}: {workspaceId: string; name: string}) =>
      createChannel(workspaceId, {name}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

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

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({workspaceId, channelId}: {workspaceId: string; channelId: string}) =>
      deleteChannel(workspaceId, channelId),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

// ----- Members -----

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({userId, workspaceId}: {userId: string; workspaceId: string}) =>
      addUserToWorkspace(userId, workspaceId),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({userId, workspaceId}: {userId: string; workspaceId: string}) =>
      removeUserFromWorkspace(userId, workspaceId),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qk.workspaces}),
  });
}

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
